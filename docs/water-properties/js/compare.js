// compare.js
// Property-by-property comparison between two thermodynamic states
// ASSUMES INTERNAL UNITS (K, MPa, kJ/kg, etc.)

import { EPS } from "./constants.js";

// Canonical property keys used across the app
const COMPARABLE_KEYS = [
  "density",
  "specificVolume",
  "enthalpy",
  "entropy",
  "cp",
  "cv",
  "viscosity",
  "conductivity"
];

/**
 * Compare two property sets
 *
 * @param {object} model - Computed properties (user / solver result)
 * @param {object} reference - Reference properties (IF97 baseline)
 * @returns {object} comparison report
 */
export function compareProperties(model, reference) {
  const comparison = {};

  for (const key of COMPARABLE_KEYS) {
    const modelVal = model?.[key];
    const refVal = reference?.[key];

    if (
      Number.isFinite(modelVal) &&
      Number.isFinite(refVal)
    ) {
      const absError = modelVal - refVal;

      const relErrorPercent =
        Math.abs(refVal) > EPS
          ? (absError / refVal) * 100
          : null;

      comparison[key] = {
        model: modelVal,
        reference: refVal,
        absError,
        relErrorPercent
      };
    }
  }

  return comparison;
}
