// iapws95/solver.js
// Robust density solver for IAPWS-95 Helmholtz EOS
// Phase-stable Newton solver with liquid/vapor root enforcement

import { Tc, rhoc, R, MAX_ITER, TOL } from "./constants95.js";
import {
  pressureFromRho,
  dPdrho
} from "./pressure.js";

/**
 * Solve density rho [kg/m^3] for given T [K], P [MPa]
 */
export function solveDensity(T, P, rho0) {
  let rho = rho0;

  // --------------------------------------------------
  // Phase inference from initial guess
  // --------------------------------------------------
  const isLiquid = rho0 > rhoc;

  // Conservative density bounds
  const RHO_MIN = 1e-6;
  const RHO_MAX = 2000.0;

  // Phase-specific bounds
  const rho_lo = isLiquid ? rhoc : RHO_MIN;
  const rho_hi = isLiquid ? RHO_MAX : rhoc;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const Pcalc = pressureFromRho(T, rho);
    const f = Pcalc - P;

    // Converged
    if (Math.abs(f) < TOL) return rho;

    const dPd = dPdrho(T, rho);
    if (!Number.isFinite(dPd) || dPd <= 0) {
      throw new Error("Non-physical dP/drho encountered");
    }

    // --------------------------------------------------
    // Newton step
    // --------------------------------------------------
    let rho_new = rho - f / dPd;

    // --------------------------------------------------
    // STEP GUARDS (critical)
    // --------------------------------------------------

    // Prevent NaN / negative density
    if (!Number.isFinite(rho_new) || rho_new <= 0) {
      rho_new = 0.5 * rho;
    }

    // Enforce phase root (NO phase jumping)
    if (isLiquid && rho_new < rho_lo) {
      rho_new = 0.5 * (rho + rho_lo);
    }

    if (!isLiquid && rho_new > rho_hi) {
      rho_new = 0.5 * (rho + rho_hi);
    }

    // Prevent runaway divergence
    if (rho_new > RHO_MAX) rho_new = RHO_MAX;
    if (rho_new < RHO_MIN) rho_new = RHO_MIN;

    // --------------------------------------------------
    // Damping (adaptive)
    // --------------------------------------------------
    rho = 0.5 * rho + 0.5 * rho_new;
  }

  throw new Error("IAPWS-95 density solver failed");
}
