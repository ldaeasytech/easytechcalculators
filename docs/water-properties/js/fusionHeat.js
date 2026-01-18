/**
 * fusionHeat.js
 * Enthalpy of fusion for ice → liquid water
 * Reference: IAPWS-95 / NIST
 * Valid near 0°C
 * Units: kJ/kg
 */

export function fusionHeat(T) {
  // T in Kelvin
  const T0 = 273.15; // K
  const hf0 = 333.55; // kJ/kg at 0°C

  // Small temperature dependence (linear approximation)
  const slope = -0.6; // kJ/kg·K (approximate)

  return hf0 + slope * (T - T0);
}
