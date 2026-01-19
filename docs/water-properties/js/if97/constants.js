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

// Specific gas constant for water (IF97 standard)
export const R = 0.461526; // kJ/(kg·K)

// Numerical tolerance (used everywhere)
export const EPS = 1e-9;

// -----------------------------------------------------------------------------
// Critical & reference points
// -----------------------------------------------------------------------------

export const Tc = 647.096;   // K
export const Pc = 22.064;    // MPa
export const rhoc = 322.0;   // kg/m³

// Triple point (ice boundary)
export const Tt = 273.16;    // K
export const Pt = 0.000611657; // MPa

// -----------------------------------------------------------------------------
// IF97 reference state
// -----------------------------------------------------------------------------

export const T_REF = 273.15;   // K
export const P_REF = 0.101325; // MPa

export const H_REF = 0.0;      // kJ/kg
export const S_REF = 0.0;      // kJ/(kg·K)

// -----------------------------------------------------------------------------
// Global validity limits (ALL regions)
// -----------------------------------------------------------------------------

// Allow ice + IF97 high-T region
export const T_MIN = 250.0;     // K  (ice-safe)
export const T_MAX = 2273.15;   // K  (Region 5 max)

// Pressure bounds
export const P_MIN = 1e-6;      // MPa (near-vacuum safe)
export const P_MAX = 100.0;     // MPa

// Density guards
export const RHO_MIN = 1e-9;    // kg/m³
export const RHO_MAX = 2000.0;  // kg/m³

// -----------------------------------------------------------------------------
// IF97 region boundaries (used by compare.js)
// -----------------------------------------------------------------------------

export const T_R1_MAX = 623.15;  // K
export const T_R2_MIN = 623.15;  // K
export const T_R5_MIN = 1073.15; // K
export const P_R5_MAX = 50.0;    // MPa
