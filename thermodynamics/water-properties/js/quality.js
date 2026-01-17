import * as liquid from "./regions/liquid.js";
import * as vapor from "./regions/vapor.js";

export function computeQuality({ T, P, enthalpy, entropy, specificVolume }) {
  const L = liquid.compute(T, P);
  const V = vapor.compute(T, P);

  if (!isNaN(enthalpy)) {
    return clamp((enthalpy - L.enthalpy) / (V.enthalpy - L.enthalpy));
  }

  if (!isNaN(entropy)) {
    return clamp((entropy - L.entropy) / (V.entropy - L.entropy));
  }

  if (!isNaN(specificVolume)) {
    return clamp((specificVolume - L.specificVolume) / (V.specificVolume - L.specificVolume));
  }

  return 0.5;
}

function clamp(x) {
  return Math.max(0, Math.min(1, x));
}

