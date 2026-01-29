// iapws95/solver.js
// Hybrid Newton–Brent density solver for IAPWS-95 Helmholtz EOS
// Phase-stable, saturation-enforced, with optional convergence logging

import { Tc, rhoc, R, MAX_ITER, TOL } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";

// Saturation envelope (used ONLY to enforce physical admissibility)
import { rho_f_sat, rho_g_sat } from "../if97/region4.js";

// -----------------------------------------------
// Debug flag (set false to silence logs)
// -----------------------------------------------
const DEBUG_SOLVER = true;

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 */
export function solveDensity(T, P, rho0) {

  // --------------------------------------------------
  // Phase inference from initial guess
  // --------------------------------------------------
  const isLiquid = rho0 > rhoc;

  // --------------------------------------------------
  // Physical bounds
  // --------------------------------------------------
  const RHO_MIN = 1e-6;
  const RHO_MAX = 2000.0;

  // --------------------------------------------------
  // Phase-safe bracketing (CRITICAL)
  // --------------------------------------------------
  let a, b;

  if (isLiquid) {
    a = rho_f_sat(T);   // liquid MUST be above saturated liquid density
    b = RHO_MAX;
  } else {
    a = RHO_MIN;
    b = rho_g_sat(T);   // vapor MUST be below saturated vapor density
  }

  // Initial bracket residuals
  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  if (fa * fb > 0) {
    throw new Error("IAPWS-95: density root not bracketed (phase logic error)");
  }

  // --------------------------------------------------
  // Initial iterate (clamped to bracket)
  // --------------------------------------------------
  let rho = Math.min(Math.max(rho0, a), b);
  let f = pressureFromRho(T, rho) - P;

  let rho_prev = rho;
  let f_prev = f;

  // --------------------------------------------------
  // Iteration loop
  // --------------------------------------------------
  for (let iter = 0; iter < MAX_ITER; iter++) {

    // ---- Diagnostic logging ----
    if (DEBUG_SOLVER) {
      const Pcalc = pressureFromRho(T, rho);
      console.log(
        `[IAPWS95] iter=${iter} ` +
        `rho=${rho.toFixed(6)} kg/m3 ` +
        `Pcalc=${Pcalc.toFixed(6)} MPa ` +
        `error=${(Pcalc - P).toExponential(3)}`
      );
    }

    // ---- Convergence ----
    if (Math.abs(f) < TOL) return rho;

    let rho_new;
    let usedNewton = false;

    // --------------------------------------------------
    // Newton step (FAST when safe)
    // --------------------------------------------------
    const dPd = dPdrho(T, rho);
    if (Number.isFinite(dPd) && Math.abs(dPd) > 1e-10) {
      const candidate = rho - f / dPd;
      if (candidate > a && candidate < b) {
        rho_new = candidate;
        usedNewton = true;
      }
    }

    // --------------------------------------------------
    // Brent fallback (SECANT → BISECTION)
    // --------------------------------------------------
    if (!usedNewton) {
      if (Math.abs(f - f_prev) > 1e-12) {
        rho_new = rho - f * (rho - rho_prev) / (f - f_prev);
      } else {
        rho_new = 0.5 * (a + b);
      }
    }

    // ---- Safety clamps ----
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
    // Update bracket
    // --------------------------------------------------
    if (fa * f_new <= 0) {
      b = rho_new;
      fb = f_new;
    } else {
      a = rho_new;
      fa = f_new;
    }

    // Prepare next iteration
    rho_prev = rho;
    f_prev = f;

    rho = rho_new;
    f = f_new;
  }

  throw new Error("IAPWS-95 hybrid Newton–Brent density solver failed");
}
