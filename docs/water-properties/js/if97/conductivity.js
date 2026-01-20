// conductivity.js
// IAPWS 2011 thermal conductivity of water and steam
// INPUTS:
//   T   [K]
//   rho [kg/m³]
// OUTPUT:
//   conductivity [W/(m·K)]

import { Tc, rhoc, EPS } from "../constants.js";

/* IAPWS 2011 coefficients */
const L = [
  [1.60397357, 2.33771842, 2.19650529, -1.21051378, -2.7203370],
  [2.78843778, -1.64647687, -2.91093611, 1.55548907, 0.0],
  [-1.44448404, 0.51692508, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0]
];

export function conductivity(T, rho) {
  const Tbar = T / Tc;
  const rhobar = rho / rhoc;

  /* ------------------------------------------------------------
     λ0 — dilute gas contribution
     ------------------------------------------------------------ */
  const lambda0 =
    1.67752 +
    2.20462 / Tbar +
    0.6366564 / (Tbar ** 2) -
    0.241605 / (Tbar ** 3);

  /* ------------------------------------------------------------
     λ1 — residual contribution
     ------------------------------------------------------------ */
  let sum = 0;
  for (let i = 0; i < L.length; i++) {
    for (let j = 0; j < L[i].length; j++) {
      if (L[i][j] !== 0) {
        sum +=
          L[i][j] *
          (1 / Tbar - 1) ** i *
          (rhobar - 1) ** j;
      }
    }
  }

  const lambda1 = Math.exp(rhobar * sum);

  /* ------------------------------------------------------------
     λ = λ0 · λ1  (NO critical enhancement in web calculator)
     ------------------------------------------------------------ */
  return lambda0 * lambda1;
}
