import { validateInputs } from "./validator.js";
import { computeQuality } from "./quality.js";
import { convertToSI, convertFromSI } from "./unitConverter.js";
import { solveIF97 } from "./if97/if97.js";
import { viscosity } from "./if97/viscosity.js";
import { conductivity } from "./if97/conductivity.js";
import { latentHeat } from "./latentHeat.js";
import { fusionHeat } from "./fusionHeat.js";
import { sublimationHeat } from "./sublimationHeat.js";

/**
 * Main solver entry point
 */
export async function solve(userInputs, unitSystem = "SI") {
  const inputsSI = convertToSI(userInputs, unitSystem);

  const validation = validateInputs(inputsSI);
  if (validation.fatal) {
    return {
      status: "fatal",
      errors: validation.errors,
      warnings: validation.warnings,
      suggestions: validation.suggestions
    };
  }

  let result;
  try {
    result = await solveIF97(inputsSI);
  } catch (err) {
    return {
      status: "fatal",
      errors: ["Solver failed: " + err.message],
      warnings: [],
      suggestions: ["Try different input pair or set phase = saturated."]
    };
  }

  const {
    T,
    P,
    phase,
    quality,
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  } = result;

  // Transport properties
  const mu = viscosity(T, density);
  const k = conductivity(T, density);

  // Enthalpy of vaporization
  let h_fg = null;
  let h_fg_note = null;
  if (phase === "saturated" || phase === "two-phase") {
    try {
      h_fg = latentHeat(T, P);
    } catch {
      h_fg = null;
      h_fg_note = "Unable to compute latent heat for this state.";
    }
  } else {
    h_fg_note = "Latent heat is defined only for saturated or two-phase states.";
  }

  // Enthalpy of fusion (ice → liquid)
  let h_if = fusionHeat(T, phase);
  let h_if_note = null;
  if (h_if === null && phase === "ice") {
    h_if_note = "Fusion enthalpy is defined only at the melting point (~0°C).";
  }

  // Enthalpy of sublimation (ice → vapor)
  let h_sub = sublimationHeat(T, P, phase);
  let h_sub_note = null;
  if (h_sub === null && phase === "ice") {
    h_sub_note = "Sublimation enthalpy is defined only near the triple point or along the sublimation curve.";
  }

  const resultsSI = {
    ...result,
    viscosity: mu,
    thermalConductivity: k,
    enthalpyOfVaporization: h_fg,
    enthalpyOfVaporizationNote: h_fg_note,
    enthalpyOfFusion: h_if,
    enthalpyOfFusionNote: h_if_note,
    enthalpyOfSublimation: h_sub,
    enthalpyOfSublimationNote: h_sub_note
  };

  const resultsUser = convertFromSI(resultsSI, unitSystem);

  return {
    status: "ok",
    results: resultsUser,
    errors: validation.errors || [],
    warnings: validation.warnings || [],
    suggestions: validation.suggestions || []
  };
}
