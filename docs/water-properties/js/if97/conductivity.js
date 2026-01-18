// IAPWS 2011 thermal conductivity with Olchowy–Sengers enhancement
// T [K], rho [kg/m3] → lambda [W/(m·K)]

const rhoc = 322;
const Tc = 647.096;

const L = [
  [1.60397357, 2.33771842, 2.19650529, -1.21051378, -2.7203370],
  [2.78843778, -1.64647687, -2.91093611, 1.55548907, 0.0],
  [-1.44448404, 0.51692508, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0]
];

// Olchowy–Sengers constants
const kB = 1.380649e-23;
const xi0 = 0.13e-9;
const nu = 0.63;

export function conductivity(T, rho, cp, mu) {
  const Tbar = T / Tc;
  const rhobar = rho / rhoc;

  /* ---- λ0 ---- */
  const lambda0 =
    1.67752 +
    2.20462 / Tbar +
    0.6366564 / (Tbar * Tbar) -
    0.241605 / (Tbar * Tbar * Tbar);

  /* ---- λ1 ---- */
  let sum = 0;
  for (let i = 0; i < L.length; i++) {
    for (let j = 0; j < L[i].length; j++) {
      if (L[i][j] !== 0) {
        sum +=
          L[i][j] *
          Math.pow(1 / Tbar - 1, i) *
          Math.pow(rhobar - 1, j);
      }
    }
  }
  const lambda1 = Math.exp(rhobar * sum);

  /* ---- λ2 (Olchowy–Sengers) ---- */
  const deltaT = Math.abs(T - Tc) / Tc;
  const xi = xi0 * Math.pow(deltaT + 1e-6, -nu);

  // Critical enhancement term
  const lambda2 =
    (kB * T * T * rho * rho * cp) /
    (6 * Math.PI * mu * xi);

  return lambda0 * lambda1 + lambda2;
}
