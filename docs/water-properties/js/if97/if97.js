// if97.js — SAFE IF97 FACADE
// Delegates ALL thermodynamic logic to solver.js
// No region selection, no saturation logic, no unit conversion

import { solve } from "../solver.js";
import { viscosity } from "./viscosity.js";
import { conductivity } from "./conductivity.js";

/* ============================================================
   Public API
   ============================================================ */

/**
 * Compute water/steam properties using IF97
 * Inputs MUST already be in IF97 units:
 *   T [K], P [MPa], h [kJ/kg], s [kJ/kg-K], x [-]
 */
export function computeIF97(inputs) {
  // Delegate ALL logic to the solver
  const state = solve(inputs);

  // Transport properties: only for single-phase states
  if (
    state.phase !== "two_phase" &&
    Number.isFinite(state.density) &&
    state.density > 0
  ) {
    state.viscosity = viscosity(state.T, state.density);
    state.conductivity = conductivity(state.T, state.density);
  } else {
    state.viscosity = NaN;
    state.conductivity = NaN;
  }

  return state;
}
