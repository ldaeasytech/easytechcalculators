import { validateInputs } from "./validator.js";
import { computeQuality } from "./quality.js";
import { convertToSI, convertFromSI } from "./unitConverter.js";
import { solveIF97 } from "./if97/if97.js";
import { viscosity } from "./if97/viscosity.js";
import { conductivity } from "./if97/conductivity.js";
import { latentHeat } from "./latentHeat.js";

/**
 * Main solver entry point
 */
export async function solve(userInputs, unitSystem = "SI") {
  // Convert all inputs to SI
  const inputsSI = convertToSI(userInputs, unitSystem);

  // Validate inputs
  const validation = validateInputs(inputsSI);
  if (validation.fatal) {
    return {
      status: "fatal",
      errors: validation.errors,
      warnings: validation.warnings,
      suggestions: validation.suggestions
    };
  }

  // Indicate calculation in progress (for UI)
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

  // Enthalpy of vaporization (only meaningful on saturation line)
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

  const resultsSI = {
    ...result,
    viscosity: mu,
    thermalConductivity: k,
    enthalpyOfVaporization: h_fg,
    enthalpyOfVaporizationNote: h_fg_note
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
