// Enthalpy of sublimation (ice → vapor)
// h_sub = h_if + h_fg
// Returns J/kg

import { fusionHeat } from "./fusionHeat.js";
import { latentHeat } from "./latentHeat.js";

export function sublimationHeat(T, P, phase) {
  // Only meaningful for ice or at triple point / sublimation conditions
  if (phase !== "ice" && phase !== "saturated" && phase !== "two-phase") {
    return null;
  }

  // Fusion heat (ice → liquid)
  const h_if = fusionHeat(T, phase);
  if (h_if === null) return null;

  // Vaporization heat (liquid → vapor) — use saturation at same T or P
  let h_fg;
  try {
    h_fg = latentHeat(T, P);
  } catch {
    return null;
  }

  return h_if + h_fg;
}
