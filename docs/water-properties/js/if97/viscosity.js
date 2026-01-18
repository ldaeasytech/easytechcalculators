// IAPWS 2008 formulation for dynamic viscosity of water and steam
// Valid for: 273.15 K ≤ T ≤ 1173.15 K, p ≤ 100 MPa
// Returns viscosity in Pa·s

import { R } from "./constants.js";

const H = [
  [0.5132047, 0.3205656, 0, 0, 0, 0],
  [0.2151778, 0.7317883, 1.241044, 1.476783, 0, 0],
  [-0.2818107, -1.070786, -1.263184, 0, 0, 0],
  [0.1778064, 0.460504, 0.2340379, 0, 0, 0],
  [-0.0417661, 0, 0, 0, 0, 0]
];

const I = [0, 1, 2, 3, 4];
const J = [0, 1, 2, 3, 4, 5];

const rhoc = 322; // kg/m³
const Tc = 647.096;
const mu0_ref = 1e-6; // Pa·s scaling

export function viscosity(T, rho) {
  const Tbar = T / Tc;
  const rhobar = rho / rhoc;

  // Ideal gas part μ0
  const mu0 = 100 * Math.sqrt(Tbar) /
    (1 + 0.978197 / Tbar + 0.579829 / (Tbar * Tbar) - 0.202354 / (Tbar * Tbar * Tbar));

  // Residual part μ1
  let sum = 0;
  for (let i = 0; i < I.length; i++) {
    for (let j = 0; j < J.length; j++) {
      sum += H[i][j] * Math.pow(1 / Tbar - 1, I[i]) * Math.pow(rhobar - 1, J[j]);
    }
  }
  const mu1 = Math.exp(rhobar * sum);

  // No critical enhancement term (μ2) — optional, small except near critical

  return mu0 * mu1 * mu0_ref; // Pa·s
}

