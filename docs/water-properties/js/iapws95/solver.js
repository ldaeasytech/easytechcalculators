// iapws95/solver.js
// Robust density solver for full IAPWS-95
// Phase-consistent Newton + safeguarded bisection

import { R, rhoc, MAX_ITER, TOL } from "./constants95.js";
import { pressureFromRho, dPdrho } from "./pressure.js";

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 */
export function solveDensity(T, P) {

  // --------------------------------------------------
  // Phase-aware initial guess
  // --------------------------------------------------
  const P_Pa = P * 1e6;
  let rho0;

  // Ideal gas estimate
  const rho_ig = P_Pa / (R * T);

  // If clearly liquid-like, start near water density
  if (rho_ig > rhoc) {
    rho0 = 1000.0;
  } else {
    rho0 = Math.max(rho_ig, 0.5);
  }

  // --------------------------------------------------
  // Local bracket around initial guess
  // --------------------------------------------------
  let a = 0.5 * rho0;
  let b = 2.0 * rho0;

  // Expand bracket if needed
  for (let i = 0; i < 20; i++) {
    const fa = pressureFromRho(T, a) - P;
    const fb = pressureFromRho(T, b) - P;
    if (fa * fb < 0) break;
    a *= 0.5;
    b *= 2.0;
  }

  let rho = rho0;
  let f = pressureFromRho(T, rho) - P;

  // --------------------------------------------------
  // Newton–bisection loop
  // --------------------------------------------------
  for (let iter = 0; iter < MAX_ITER; iter++) {

    if (Math.abs(f) < TOL) return rho;

    const dPd = dPdrho(T, rho);

    let rho_new;

    // Newton step if stable
    if (Number.isFinite(dPd) && dPd > 0) {
      rho_new = rho - f / dPd;
    }

    // Fallback to bisection
    if (!Number.isFinite(rho_new) || rho_new <= a || rho_new >= b) {
      rho_new = 0.5 * (a + b);
    }

    const f_new = pressureFromRho(T, rho_new) - P;

    // Update bracket
    if ((pressureFromRho(T, a) - P) * f_new < 0) {
      b = rho_new;
    } else {
      a = rho_new;
    }

    rho = rho_new;
    f = f_new;
  }

  throw new Error("IAPWS-95: density solver did not converge");
}
