// iapws95/solver.js
// Hybrid Newton–Brent density solver for IAPWS-95 Helmholtz EOS
// Phase-stable, saturation-enforced, unit-consistent
//
// Pressure units: MPa
// Density units: kg/m^3
//
// NOTE:
// pressureFromRho() and dPdrho() MUST return MPa

import { rhoc, MAX_ITER, TOL } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";

// Saturation envelope (used ONLY to enforce physical admissibility)
import { rho_f_sat, rho_g_sat } from "../if97/region4.js";

// --------------------------------------------------
// Debug flag (set true to inspect convergence)
// --------------------------------------------------
const DEBUG_SOLVER = false;

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 */
export function solveDensity(T, P, rho0) {

  // --------------------------------------------------
  // Phase inference from initial guess
  // --------------------------------------------------
  const isLiquid = rho0 > rhoc;

  // --------------------------------------------------
  // Absolute safety bounds
  // --------------------------------------------------
  const RHO_MIN = 1e-6;
  const RHO_MAX = 2000.0;

  // --------------------------------------------------
  // Phase-safe admissible bracket (CRITICAL)
  // --------------------------------------------------
  let a, b;

  if (isLiquid) {
    // Liquid root must lie ABOVE saturated liquid density
    a = rho_f_sat(T);
    b = RHO_MAX;
  } else {
    // Vapor root must lie BELOW saturated vapor density
    a = RHO_MIN;
    b = rho_g_sat(T);
  }

  // --------------------------------------------------
  // Initial iterate (clamped to admissible domain)
  // --------------------------------------------------
  let rho = Math.min(Math.max(rho0, a), b);
  let f = pressureFromRho(T, rho) - P;

  let rho_prev = rho;
  let f_prev = f;

  // --------------------------------------------------
  // Iteration loop
  // --------------------------------------------------
  for (let iter = 0; iter < MAX_ITER; iter++) {

    // ---- Optional diagnostics ----
    if (DEBUG_SOLVER) {
      const Pcalc = pressureFromRho(T, rho);
      console.log(
        `[IAPWS95] iter=${iter} ` +
        `rho=${rho.toFixed(6)} kg/m3 ` +
        `Pcalc=${Pcalc.toFixed(6)} MPa ` +
        `error=${(Pcalc - P).toExponential(3)}`
      );
    }

    // --------------------------------------------------
    // Convergence criteria
    // --------------------------------------------------
    const rhoTol = 1e-8 * rho; // relative density tolerance

    if (Math.abs(f) < TOL && Math.abs(rho - rho_prev) < rhoTol) {
      return rho;
    }

    let rho_new;
    let usedNewton = false;

    // --------------------------------------------------
    // Newton step (fast when safe)
    // --------------------------------------------------
    const dPd = dPdrho(T, rho);

    if (Number.isFinite(dPd) && Math.abs(dPd) > 1e-12) {
      const candidate = rho - f / dPd;
      if (candidate > a && candidate < b) {
        rho_new = candidate;
        usedNewton = true;
      }
    }

    // --------------------------------------------------
    // Brent-style fallback (secant → bisection)
    // --------------------------------------------------
    if (!usedNewton) {
      if (Math.abs(f - f_prev) > 1e-14) {
        rho_new = rho - f * (rho - rho_prev) / (f - f_prev);
      } else {
        rho_new = 0.5 * (a + b);
      }
    }

    // --------------------------------------------------
    // Safety clamps
    // --------------------------------------------------
    if (!Number.isFinite(rho_new)) {
      rho_new = 0.5 * (a + b);
    }

    if (rho_new < RHO_MIN) rho_new = RHO_MIN;
    if (rho_new > RHO_MAX) rho_new = RHO_MAX;

    // --------------------------------------------------
    // Evaluate new point
    // --------------------------------------------------
    const f_new = pressureFromRho(T, rho_new) - P;

    // --------------------------------------------------
    // Update admissible bracket
    // (sign-change is relaxed; physics enforces bounds)
    // --------------------------------------------------
    if (f * f_new <= 0) {
      b = rho_new;
    } else {
      a = rho_new;
    }

    // --------------------------------------------------
    // Prepare next iteration
    // --------------------------------------------------
    rho_prev = rho;
    f_prev = f;

    rho = rho_new;
    f = f_new;
  }

  throw new Error("IAPWS-95 hybrid Newton–Brent density solver failed");
}
