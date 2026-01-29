// iapws95/solver.js
// Robust density solver for IAPWS-95 Helmholtz EOS
// Phase-agnostic, no saturation logic, no fallback density

import { MAX_ITER, TOL } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";

// -----------------------------------------------
// Debug flag
// -----------------------------------------------
const DEBUG_SOLVER = false;

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 * Uses hybrid Newton–Brent method with unconditional bracketing
 *
 * @param {number} T   Temperature [K]
 * @param {number} P   Pressure [MPa]
 * @param {number=} rho0 Optional initial guess [kg/m^3]
 */
export function solveDensity(T, P, rho0 = NaN) {

  // --------------------------------------------------
  // Unconditional physical bounds (CRITICAL)
  // --------------------------------------------------
  let a = 1e-6;     // near vacuum
  let b = 2000.0;   // well above liquid water

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) {
    throw new Error("IAPWS-95: density root not bracketed");
  }

  // --------------------------------------------------
  // Initial iterate
  // --------------------------------------------------
  let rho = Number.isFinite(rho0) && rho0 > a && rho0 < b
    ? rho0
    : 0.5 * (a + b);

  let f = pressureFromRho(T, rho) - P;

  let rho_prev = rho;
  let f_prev = f;

  // --------------------------------------------------
  // Iteration loop
  // --------------------------------------------------
  for (let iter = 0; iter < MAX_ITER; iter++) {

    if (DEBUG_SOLVER) {
      console.log(
        `[IAPWS95] iter=${iter} ` +
        `rho=${rho.toFixed(6)} kg/m3 ` +
        `Pcalc=${pressureFromRho(T, rho).toFixed(6)} MPa ` +
        `err=${f.toExponential(3)}`
      );
    }

    // ---- Convergence ----
    if (Math.abs(f) < TOL) return rho;

    let rho_new;
    let usedNewton = false;

    // --------------------------------------------------
    // Newton step (preferred)
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
    // Secant / bisection fallback
    // --------------------------------------------------
    if (!usedNewton) {
      if (Math.abs(f - f_prev) > 1e-14) {
        rho_new = rho - f * (rho - rho_prev) / (f - f_prev);
      } else {
        rho_new = 0.5 * (a + b);
      }
    }

    // ---- Safety clamps ----
    if (!Number.isFinite(rho_new)) rho_new = 0.5 * (a + b);
    if (rho_new <= a || rho_new >= b) rho_new = 0.5 * (a + b);

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

    rho_prev = rho;
    f_prev = f;

    rho = rho_new;
    f = f_new;
  }

  throw new Error("IAPWS-95: density solver did not converge");
}
