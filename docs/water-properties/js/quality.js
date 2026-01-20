// quality.js
// Vapor quality helper

export function computeQuality(satL, satV, given) {
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
      "Quality requires enthalpy, entropy, or specific volume."
    );
  }

  if (!Number.isFinite(den) || den === 0) return NaN;

  return Math.max(0, Math.min(1, num / den));
}
