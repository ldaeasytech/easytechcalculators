// constants.js
// Central physical constants for IF97 + IAPWS transport
// INTERNAL UNITS (STRICT):
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   s  → kJ/(kg·K)
//   cp → kJ/(kg·K)
//   ρ  → kg/m³

// -----------------------------------------------------------------------------
// Universal constants
// -----------------------------------------------------------------------------

// Specific gas constant for water (IAPWS)
export const R = 0.461526; // kJ/(kg·K)

// Numerical tolerance
export const EPS = 1e-9;

// --- Water fixed points (IAPWS) ---
export const T_TRIPLE = 273.16;     // K
export const P_TRIPLE = 0.000611657; // MPa

export const T_CRIT = 647.096;      // K
export const P_CRIT = 22.064;       // MPa

// -----------------------------------------------------------------------------
// Critical & reference points
// -----------------------------------------------------------------------------

export const Tc = 647.096;    // K
export const Pc = 22.064;     // MPa
export const rhoc = 322.0;    // kg/m³

// Triple point
export const Tt = 273.16;     // K
export const Pt = 0.000611657; // MPa

// -----------------------------------------------------------------------------
// Global validity limits
// -----------------------------------------------------------------------------

export const T_MIN = 250.0;      // K
export const T_MAX = 2273.15;    // K

export const P_MIN = 1e-6;       // MPa
export const P_MAX = 1000.0;      // MPa

export const RHO_MIN = 1e-9;     // kg/m³
export const RHO_MAX = 2000.0;   // kg/m³

// -----------------------------------------------------------------------------
// IF97 region boundaries
// -----------------------------------------------------------------------------

export const T_R1_MAX = 623.15;   // K
export const T_R5_MIN = 1073.15;  // K
export const P_R5_MAX = 50.0;     // MPa
