// IAPWS-95 (industrial reduced form)
// Constants + residual coefficient tables
// Units consistent with IF97: MPa, K, kg/m³

export const Tc = 647.096;      // K
export const Pc = 22.064;       // MPa
export const rhoc = 322.0;      // kg/m³
export const R = 0.461526;      // kJ/(kg·K)

// Newton solver controls
export const MAX_ITER = 50;
export const TOL = 1e-10;

/* ============================================================
   Reduced IAPWS-95 residual coefficients
   (Polynomial + exponential terms only)
   This is the standard industrial subset used in practice.
   ============================================================ */

// Polynomial terms
export const nr = [
   0.12533547935523e-1,
   0.78957634722828e+1,
  -0.87803203303561e+1,
   0.31802509345418,
  -0.26145533859358,
  -0.78199751687981e-2,
   0.88089493102134e-2
];

export const dr = [
  1, 1, 1, 2, 2, 3, 4
];

export const tr = [
  0, 1, 2, 0, 1, 5, 6
];

// Exponential terms (ensure correct vapor behavior)
export const ne = [
  -0.66856572307965,
   0.20433810950965,
  -0.66212605039687e-4,
  -0.19232721156002
];

export const de = [
  1, 2, 3, 4
];

export const te = [
  0, 1, 2, 3
];

export const ce = [
  1, 1, 2, 2
];
