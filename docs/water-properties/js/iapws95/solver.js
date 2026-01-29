// iapws95/solver.js
// Robust density solver for IAPWS-95 Helmholtz EOS

import { Tc, rhoc, R, MAX_ITER, TOL } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 */


export function solveDensity(T, P, rho0) {
  rho0 = 1;
  let rho = rho0;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const Pcalc = pressureFromRho(T, rho);
    const f = Pcalc - P;

    if (Math.abs(f) < TOL) return rho;

    const dPd = dPdrho(T, rho);
    if (!Number.isFinite(dPd) || dPd <= 0) {
      throw new Error("Non-physical dP/drho encountered");
    }

    // Newton step
    let rho_new = rho - f / dPd;

    // ---- STEP 3 GUARDS ----

    // Prevent non-physical densities
    if (!Number.isFinite(rho_new) || rho_new <= 0) {
      rho_new = 0.5 * rho;
    }

    // Prevent liquid-root capture when solving vapor
    if (rho < rhoc && rho_new > 1.5 * rhoc) {
      rho_new = 0.5 * (rho + rhoc);
    }

    // Damping
    rho = 0.5 * rho + 0.5 * rho_new;
  }
  console.log("IAPWS density iteration:", rho);

  throw new Error("IAPWS-95 density solver failed");
}
