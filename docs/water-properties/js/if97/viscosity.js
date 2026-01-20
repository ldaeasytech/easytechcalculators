// viscosity.js
// IAPWS 2008 dynamic viscosity of water and steam
// INPUTS:
//   T   [K]
//   rho [kg/m³]
// OUTPUT:
//   viscosity [Pa·s]

import { Tc, rhoc, EPS } from "../constants.js";

/* IAPWS 2008 coefficients */
const H = [
  [0.5132047, 0.3205656, 0, 0, 0, 0],
  [0.2151778, 0.7317883, 1.241044, 1.476783, 0, 0],
  [-0.2818107, -1.070786, -1.263184, 0, 0, 0],
  [0.1778064, 0.460504, 0.2340379, 0, 0, 0],
  [-0.0417661, 0, 0, 0, 0, 0]
];

export function viscosity(T, rho) {
  const Tbar = T / Tc;
  const rhobar = rho / rhoc;

  /* ------------------------------------------------------------
     μ0 — dilute gas contribution
     ------------------------------------------------------------ */
  const mu0 =
    1e-6 *
    Math.sqrt(Tbar) /
    Math.max(
      1 +
        0.978197 / Tbar +
        0.579829 / (Tbar ** 2) -
        0.202354 / (Tbar ** 3),
      EPS
    );

  /* ------------------------------------------------------------
     μ1 — residual contribution
     ------------------------------------------------------------ */
  let sum = 0;
  for (let i = 0; i < H.length; i++) {
    for (let j = 0; j < H[i].length; j++) {
      if (H[i][j] !== 0) {
        sum +=
          H[i][j] *
          (1 / Tbar - 1) ** i *
          (rhobar - 1) ** j;
      }
    }
  }

  const mu1 = Math.exp(rhobar * sum);

  /* ------------------------------------------------------------
     μ = μ0 · μ1  (NO artificial critical enhancement)
     ------------------------------------------------------------ */
  return mu0 * mu1;
}
