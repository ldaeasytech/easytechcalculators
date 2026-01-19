// quality.js
// Vapor quality helper (NO solving, NO IF97 calls)
//
// INTERNAL UNITS:
//   h → kJ/kg
//   s → kJ/(kg·K)
//   v → m³/kg

/**
 * Compute vapor quality from saturated end states.
 *
 * @param {object} satL - Saturated liquid properties
 * @param {object} satV - Saturated vapor properties
 * @param {object} given - One of: { enthalpy | entropy | specificVolume }
 * @returns {number} x in [0,1]
 */
export function computeQuality(satL, satV, given) {
  let x;

  if (Number.isFinite(given.enthalpy)) {
    x =
      (given.enthalpy - satL.enthalpy) /
      (satV.enthalpy - satL.enthalpy);

  } else if (Number.isFinite(given.entropy)) {
    x =
      (given.entropy - satL.entropy) /
      (satV.entropy - satL.entropy);

  } else if (Number.isFinite(given.specificVolume)) {
    x =
      (given.specificVolume - satL.specificVolume) /
      (satV.specificVolume - satL.specificVolume);

  } else {
    throw new Error(
      "Quality computation requires enthalpy, entropy, or specific volume."
    );
  }

  return clamp01(x);
}

/* ============================================================
   Utilities
   ============================================================ */

function clamp01(x) {
  if (!Number.isFinite(x)) return NaN;
  return Math.max(0, Math.min(1, x));
}
