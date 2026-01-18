// if97/constants.js
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
export const R = 0.461526;        // kJ/(kg·K)

// -----------------------------------------------------------------------------
// Critical & reference points
// -----------------------------------------------------------------------------

// Critical point of water
export const Tc = 647.096;        // K
export const Pc = 22.064;         // MPa
export const rhoc = 322.0;        // kg/m³

// Triple point (for ice / validation)
export const Tt = 273.16;         // K
export const Pt = 0.000611657;    // MPa

// -----------------------------------------------------------------------------
// IF97 reference state (MANDATORY for entropy & enthalpy stability)
// -----------------------------------------------------------------------------

// IF97 reference temperature and pressure
export const T_REF = 273.15;      // K
export const P_REF = 0.101325;    // MPa

// Reference specific enthalpy and entropy at (T_REF, P_REF)
// These MUST be zero to prevent entropy/enthalpy drift
export const H_REF = 0.0;         // kJ/kg
export const S_REF = 0.0;         // kJ/(kg·K)

// -----------------------------------------------------------------------------
// Numerical safety limits (prevents NaNs & negative densities)
// -----------------------------------------------------------------------------

export const T_MIN = 273.15;      // K
export const T_MAX = 2273.15;     // K

export const P_MIN = 0.0001;      // MPa
export const P_MAX = 100.0;       // MPa

// Density guards
export const RHO_MIN = 1e-6;      // kg/m³ (prevents divide-by-zero)
export const RHO_MAX = 2000.0;    // kg/m³ (upper physical bound)
