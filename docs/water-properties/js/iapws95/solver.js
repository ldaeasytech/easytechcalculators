// iapws95/solver.js
// Robust density solver for full IAPWS-95 (single phase)
// Phase-aware Newton + safeguarded bisection
// Uses IF97 Region 4 for saturation-based phase selection

import { R, rhoc, Tc, MAX_ITER } from "./constants95.js";
import { pressureFromRho, dPdrho } from "./pressure.js";
import { Psat_T } from "../if97/region4.js";

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 * phaseHint: "liquid" | "vapor" | "auto"
 */
export function solveDensity(T, P, phaseHint = "auto") {

  const P_Pa = P * 1e6;

  // --------------------------------------------------
  // Physical density bounds
  // --------------------------------------------------
  const RHO_MIN = 1e-6;
  const RHO_MAX = 1500.0;

  // --------------------------------------------------
  // Ideal-gas estimate
  // --------------------------------------------------
  const rho_ig = P_Pa / (R * T);

  // --------------------------------------------------
  // Phase-aware initial guess (FIXED)
  // --------------------------------------------------
  let rho0;

  if (phaseHint === "liquid") {
    rho0 = Math.max(1000.0, 1.2 * rhoc);
  } else if (phaseHint === "vapor") {
    rho0 = Math.min(Math.max(rho_ig, 0.1), 0.8 * rhoc);
  } else {
    // AUTO phase detection using saturation pressure
    if (T < Tc) {
      const Psat = Psat_T(T); // MPa
      if (P > Psat) {
        // compressed liquid
        rho0 = Math.max(1000.0, 1.2 * rhoc);
      } else {
        // superheated vapor
        rho0 = Math.min(Math.max(rho_ig, 0.1), 0.8 * rhoc);
      }
    } else {
      // supercritical
      rho0 = Math.max(rho_ig, rhoc);
    }
  }

  rho0 = Math.min(Math.max(rho0, RHO_MIN), RHO_MAX);

  // --------------------------------------------------
  // Bracketing
  // --------------------------------------------------
  let a = Math.max(0.5 * rho0, RHO_MIN);
  let b = Math.min(2.0 * rho0, RHO_MAX);

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  for (let i = 0; i < 40 && fa * fb > 0; i++) {
    a = Math.max(0.5 * a, RHO_MIN);
    b = Math.min(2.0 * b, RHO_MAX);
    fa = pressureFromRho(T, a) - P;
    fb = pressureFromRho(T, b) - P;
  }

  if (fa * fb > 0) {
    throw new Error("IAPWS-95: unable to bracket density root");
  }

  // --------------------------------------------------
  // Newton–bisection loop
  // --------------------------------------------------
  let rho = rho0;
  let f = pressureFromRho(T, rho) - P;

  for (let iter = 0; iter < MAX_ITER; iter++) {

    // Relative pressure convergence
    if (Math.abs(f / P) < 1e-8) {
      return rho;
    }

    const dPd = dPdrho(T, rho);
    let rho_new;

    // Newton step (only if stable)
    if (Number.isFinite(dPd) && dPd > 1e-12) {
      rho_new = rho - f / dPd;
    }

    // Safeguard
    if (
      !Number.isFinite(rho_new) ||
      rho_new <= a ||
      rho_new >= b
    ) {
      rho_new = 0.5 * (a + b);
    }

    const f_new = pressureFromRho(T, rho_new) - P;

    // Update bracket
    if (fa * f_new < 0) {
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
