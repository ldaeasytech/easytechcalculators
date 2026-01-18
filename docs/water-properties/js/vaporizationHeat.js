/**
 * vaporizationHeat.js
 * Enthalpy of vaporization
 * Units: kJ/kg
 * Correlation valid near saturation line
 */

export function vaporizationHeat(T) {
  const Tc = 647.096; // K
  const Tr = T / Tc;

  // IAPWS correlation constants
  const a = 2500.9;
  const b = -2.36e3;
  const c = 1.13e3;
  const d = -4.64e2;

  return a + b * Tr + c * Tr ** 2 + d * Tr ** 3;
}
