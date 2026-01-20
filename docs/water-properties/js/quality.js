// quality.js
// Vapor quality helper (saturated mixtures only)

export function computeQuality(satL, satV, given) {
  if (!satL || !satV) {
    throw new Error("Saturated liquid and vapor states are required.");
  }

  // Explicit quality provided
  if (Number.isFinite(given.quality)) {
    return Math.max(0, Math.min(1, given.quality));
  }

  let num, den;

  if (Number.isFinite(given.enthalpy)) {
    num = given.enthalpy - satL.enthalpy;
    den = satV.enthalpy - satL.enthalpy;

  } else if (Number.isFinite(given.entropy)) {
    num = given.entropy - satL.entropy;
    den = satV.entropy - satL.entropy;

  } else if (Number.isFinite(given.specificVolume)) {
    num = given.specificVolume - satL.specificVolume;
    den = satV.specificVolume - satL.specificVolume;

  } else {
    throw new Error(
      "Quality calculation requires enthalpy, entropy, or specific volume."
    );
  }

  if (!Number.isFinite(den) || den === 0) {
    throw new Error("Invalid saturated property range for quality calculation.");
  }

  return Math.max(0, Math.min(1, num / den));
}
