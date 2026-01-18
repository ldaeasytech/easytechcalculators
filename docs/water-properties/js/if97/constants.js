// if97/constants.js
// Central physical constants for IF97 + IAPWS transport
// INTERNAL UNITS:
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   cp → kJ/(kg·K)
//   ρ  → kg/m³

// Specific gas constant for water
export const R = 0.461526;        // kJ/(kg·K)

// Critical point
export const Tc = 647.096;        // K
export const Pc = 22.064;         // MPa
export const rhoc = 322.0;        // kg/m³

// Triple point (useful later for ice / validation)
export const Tt = 273.16;         // K
export const Pt = 0.000611657;    // MPa
