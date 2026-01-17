// Computes enthalpy of vaporization (h_fg) from IF97 saturation properties
// Returns J/kg

import { saturationProps } from "./if97/region4.js";

export function latentHeat(T = null, P = null) {
  if (T === null && P === null) {
    throw new Error("latentHeat requires either T or P");
  }

  const sat = saturationProps(T, P);
  const hf = sat.liquid.enthalpy;
  const hg = sat.vapor.enthalpy;

  return hg - hf; // J/kg
}
