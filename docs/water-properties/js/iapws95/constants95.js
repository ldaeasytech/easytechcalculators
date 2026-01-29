// IAPWS-95 (industrial reduced form)
// Constants + residual coefficient tables
// SI base units internally (Pa, J, kg, K)

export const Tc = 647.096;      // K
export const Pc = 22.064e6;     // Pa
export const rhoc = 322.0;      // kg/m³

// Gas constant (SI)
export const R = 461.526;       // J/(kg·K)

// Newton solver controls
export const MAX_ITER = 500;
export const TOL = 1e-6;        // pressure tolerance (~1 Pa)

/* ============================================================
   Ideal-gas Helmholtz coefficients (IAPWS-95)
   ============================================================ */

export const n0 = [
  -8.3204464837497,
   6.6832105268,
   3.00632,
   0.012436,
   0.97315,
   1.27950,
   0.96956,
   0.24873
];

export const gamma0 = [
  0,
  0,
  0,
  1.28728967,
  3.53734222,
  7.74073708,
  9.24437796,
  27.5075105
];

/* ============================================================
   Reduced residual coefficients (industrial subset)
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

export const dr = [1, 1, 1, 2, 2, 3, 4];
export const tr = [0, 1, 2, 0, 1, 5, 6];

// Exponential terms
export const ne = [
  -0.66856572307965,
   0.20433810950965,
  -0.66212605039687e-4,
  -0.19232721156002
];

export const de = [1, 2, 3, 4];
export const te = [0, 1, 2, 3];
export const ce = [1, 1, 2, 2];
