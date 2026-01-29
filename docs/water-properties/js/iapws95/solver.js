// iapws95/solver.js
// Density solver for FULL IAPWS-95 Helmholtz EOS
// Single-root, phase-agnostic, no heuristics

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
 * Assumes full IAPWS-95 (single physical root)
 */
export function solveDensity(T, P) {

  // --------------------------------------------------
  // Global physical bounds
  // --------------------------------------------------
  let a = 1e-6;     // near vacuum
  let b = 2000.0;   // well above liquid water

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  if (fa * fb > 0) {
    throw new Error("IAPWS-95: density root not bracketed");
  }

  // --------------------------------------------------
  // Initial guess: midpoint
  // --------------------------------------------------
  let rho = 0.5 * (a + b);
  let f = pressureFromRho(T, rho) - P;

  for (let iter = 0; iter < MAX_ITER; iter++) {

    if (DEBUG_SOLVER) {
      console.log(
        `[IAPWS95] iter=${iter} rho=${rho.toFixed(6)} ` +
        `Pcalc=${pressureFromRho(T, rho).toFixed(6)} MPa`
      );
    }

    // ---- Convergence ----
    if (Math.abs(f) < TOL) return rho;

    // --------------------------------------------------
    // Newton step
    // --------------------------------------------------
    const dPd = dPdrho(T, rho);

    let rho_new;
    if (Number.isFinite(dPd) && Math.abs(dPd) > 1e-12) {
      rho_new = rho - f / dPd;
    } else {
      rho_new = 0.5 * (a + b);
    }

    // ---- Keep iterate inside bracket ----
    if (!Number.isFinite(rho_new) || rho_new <= a || rho_new >= b) {
      rho_new = 0.5 * (a + b);
    }

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

    rho = rho_new;
    f = f_new;
  }

  throw new Error("IAPWS-95: density solver did not converge");
}
