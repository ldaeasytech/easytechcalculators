// compare.js
// Compare a given state against IF97 reference values
// Assumes INTERNAL UNITS (K, MPa, kJ/kg, etc.)

import { computeIF97 } from "./if97/if97.js";

const COMPARABLE_KEYS = [
  "density",
  "specificVolume",
  "enthalpy",
  "entropy",
  "cp",
  "cv",
  "viscosity",
  "thermalConductivity"
];

/**
 * Compare supplied properties to IF97 reference at (T, P)
 *
 * @param {number} T - Temperature [K]
 * @param {number} P - Pressure [MPa]
 * @param {object} props - Properties to compare
 * @returns {object} comparison report
 */
export function compareToIF97(T, P, props) {
  const ref = computeIF97(T, P);
  const comparison = {};

  for (const key of COMPARABLE_KEYS) {
    const modelVal = props[key];
    const refVal = ref[key];

    if (
      typeof modelVal === "number" &&
      typeof refVal === "number" &&
      isFinite(modelVal) &&
      isFinite(refVal)
    ) {
      const absError = modelVal - refVal;

      let relErrorPercent = null;
      if (Math.abs(refVal) > 1e-12) {
        relErrorPercent = (absError / refVal) * 100;
      }

      comparison[key] = {
        model: modelVal,
        IF97: refVal,
        absError,
        relErrorPercent
      };
    }
  }

  return comparison;
}
