// iapws95/solver.js
// Helmholtz EOS density solver with automatic physical-root selection
// Rejects metastable roots using thermodynamic stability checks

import { MAX_ITER, TOL, R } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";
import { properties } from "./properties.js";

// -----------------------------------------------
// Debug flag
// -----------------------------------------------
const DEBUG_SOLVER = false;

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 * Automatically selects the physically stable root
 */
export function solveDensity(T, P) {

  // --------------------------------------------------
  // Density search bounds
  // --------------------------------------------------
  const RHO_MIN = 1e-6;
  const RHO_MAX = 2000.0;

  // --------------------------------------------------
  // Candidate initial guesses (log-spaced)
  // --------------------------------------------------
  const seeds = [
    1e-3,
    1,
    10,
    50,
    200,
    500,
    800,
    1000,
    1200
  ];

  const roots = [];

  for (const rho0 of seeds) {
    try {
      const rho = solveSingleRoot(T, P, rho0, RHO_MIN, RHO_MAX);

      // Deduplicate roots
      if (roots.some(r => Math.abs(r - rho) / rho < 1e-3)) continue;

      // --------------------------------------------------
      // Thermodynamic stability check
      // --------------------------------------------------
      const dpdrho = dPdrho(T, rho);
      if (!(dpdrho > 0)) continue;

      const props = properties(T, rho);

      if (
        props.cp > 0 &&
        props.cv > 0 &&
        Number.isFinite(props.enthalpy) &&
        Number.isFinite(props.entropy)
      ) {
        if (DEBUG_SOLVER) {
          console.log("[IAPWS95] Stable root accepted:", rho);
        }
        return rho;
      }

      roots.push(rho);

    } catch {
      /* ignore failed seeds */
    }
  }

  throw new Error("IAPWS-95: no physically stable density root found");
}

/* ============================================================
   Single-root Newton–Brent solver
   ============================================================ */

function solveSingleRoot(T, P, rho0, a0, b0) {

  let a = a0;
  let b = b0;

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) {
    throw new Error("Root not bracketed");
  }

  let rho = Math.min(Math.max(rho0, a), b);
  let f = pressureFromRho(T, rho) - P;

  let rho_prev = rho;
  let f_prev = f;

  for (let iter = 0; iter < MAX_ITER; iter++) {

    if (Math.abs(f) < TOL) return rho;

    let rho_new;
    let usedNewton = false;

    // Newton step
    const dPd = dPdrho(T, rho);
    if (Number.isFinite(dPd) && Math.abs(dPd) > 1e-12) {
      const candidate = rho - f / dPd;
      if (candidate > a && candidate < b) {
        rho_new = candidate;
        usedNewton = true;
      }
    }

    // Secant / bisection fallback
    if (!usedNewton) {
      if (Math.abs(f - f_prev) > 1e-14) {
        rho_new = rho - f * (rho - rho_prev) / (f - f_prev);
      } else {
        rho_new = 0.5 * (a + b);
      }
    }

    if (!Number.isFinite(rho_new) || rho_new <= a || rho_new >= b) {
      rho_new = 0.5 * (a + b);
    }

    const f_new = pressureFromRho(T, rho_new) - P;

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

  throw new Error("Single-root solver did not converge");
}
