// iapws95/solver.js
// Helmholtz EOS density solver with mechanical-stability filtering
// Option C: accept roots with dp/dρ > 0 only

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
 * Accepts the first mechanically stable root (dp/dρ > 0)
 */
export function solveDensity(T, P) {

  // --------------------------------------------------
  // Global density bounds
  // --------------------------------------------------
  const RHO_MIN = 1e-6;
  const RHO_MAX = 2000.0;

  // --------------------------------------------------
  // Density seeds (cover vapor → liquid basins)
  // --------------------------------------------------
  const seeds = [
    1e-3,
    1,
    10,
    50,
    200,
    500,
    700,
    900,
    1100
  ];

  const accepted = [];

  for (const rho0 of seeds) {
    try {
      const rho = solveSingleRoot(T, P, rho0, RHO_MIN, RHO_MAX);

      // Deduplicate roots
      if (accepted.some(r => Math.abs(r - rho) / rho < 1e-3)) continue;

      const dpdrho = dPdrho(T, rho);

      // --------------------------------------------------
      // Mechanical stability criterion ONLY
      // --------------------------------------------------
      if (dpdrho > 0 && Number.isFinite(dpdrho)) {

        if (DEBUG_SOLVER) {
          console.log("[IAPWS95] Accepted root:", {
            rho,
            dpdrho
          });
        }

        return rho;
      }

      accepted.push(rho);

    } catch {
      // ignore failed seed
    }
  }

  throw new Error("IAPWS-95: no mechanically stable density root found");
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
    throw new Error("Density root not bracketed");
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

  throw new Error("IAPWS-95: single-root solver did not converge");
}
