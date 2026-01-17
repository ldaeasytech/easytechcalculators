import { validateInputs } from "./validator.js";
import { computeQuality } from "./quality.js";
import { convertToSI, convertFromSI } from "./unitConverter.js";
import { solveIF97 } from "./if97/if97.js";
import { viscosity } from "./if97/viscosity.js";
import { conductivity } from "./if97/conductivity.js";

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

  // Extract primary properties
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

  // Compute transport properties
  const mu = viscosity(T, density); // Pa·s
  const k = conductivity(T, density); // W/(m·K)

  // Attach transport properties
  const resultsSI = {
    ...result,
    viscosity: mu,
    thermalConductivity: k
  };

  // Convert back to user units
  const resultsUser = convertFromSI(resultsSI, unitSystem);

  return {
    status: "ok",
    results: resultsUser,
    errors: validation.errors || [],
    warnings: validation.warnings || [],
    suggestions: validation.suggestions || []
  };
}
