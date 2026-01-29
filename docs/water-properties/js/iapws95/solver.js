// iapws95/solver.js
// Hybrid Newton–Brent density solver for IAPWS-95 Helmholtz EOS
// Newton when safe, Brent fallback when Newton is unsafe

import { Tc, rhoc, R, MAX_ITER, TOL } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 */
export function solveDensity(T, P, rho0) {
  // --------------------------------------------------
  // Phase inference from initial guess
  // --------------------------------------------------
  const isLiquid = rho0 > rhoc;

  // Conservative global bounds
  const RHO_MIN = 1e-6;
  const RHO_MAX = 2000.0;

  // Phase-specific bracket
  let a = isLiquid ? rhoc : RHO_MIN;
  let b = isLiquid ? RHO_MAX : rhoc;

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  // Safety: ensure bracket validity
  if (fa * fb > 0) {
    throw new Error("IAPWS-95: root not bracketed");
  }

  // Initial iterate
  let rho = Math.min(Math.max(rho0, a), b);
  let f = pressureFromRho(T, rho) - P;

  // Track previous point for secant fallback
  let rho_prev = rho;
  let f_prev = f;

  for (let iter = 0; iter < MAX_ITER; iter++) {

    // --------------------------------------------------
    // Convergence test
    // --------------------------------------------------
    if (Math.abs(f) < TOL) return rho;

    let rho_new;
    let usedNewton = false;

    // --------------------------------------------------
    // Attempt Newton step
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
    // Brent-style fallback (secant → bisection)
    // --------------------------------------------------
    if (!usedNewton) {
      // Secant step if possible
      if (Math.abs(f - f_prev) > 1e-12) {
        rho_new = rho - f * (rho - rho_prev) / (f - f_prev);
      } else {
        rho_new = 0.5 * (a + b); // bisection
      }
    }

    // Clamp to physical bounds
    if (!Number.isFinite(rho_new)) {
      rho_new = 0.5 * (a + b);
    }

    if (rho_new <= RHO_MIN) rho_new = RHO_MIN;
    if (rho_new >= RHO_MAX) rho_new = RHO_MAX;

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

  throw new Error("IAPWS-95 hybrid Newton–Brent solver failed");
}
