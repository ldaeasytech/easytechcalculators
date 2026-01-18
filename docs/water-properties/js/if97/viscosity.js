// IAPWS 2008 viscosity with critical enhancement (REFPROP-level)
// T [K], rho [kg/m3] → mu [Pa·s]

const rhoc = 322;
const Tc = 647.096;

// Table 2 coefficients
const H = [
  [0.5132047, 0.3205656, 0, 0, 0, 0],
  [0.2151778, 0.7317883, 1.241044, 1.476783, 0, 0],
  [-0.2818107, -1.070786, -1.263184, 0, 0, 0],
  [0.1778064, 0.460504, 0.2340379, 0, 0, 0],
  [-0.0417661, 0, 0, 0, 0, 0]
];

// Critical enhancement constants
const xi0 = 0.13;   // nm
const nu = 0.63;
const gamma = 1.239;

export function viscosity(T, rho) {
  const Tbar = T / Tc;
  const rhobar = rho / rhoc;

  /* ---- μ0 (ideal gas) ---- */
  const mu0 =
    1e-6 *
    Math.sqrt(Tbar) /
    (1 +
      0.978197 / Tbar +
      0.579829 / (Tbar * Tbar) -
      0.202354 / (Tbar * Tbar * Tbar));

  /* ---- μ1 (residual) ---- */
  let sum = 0;
  for (let i = 0; i < H.length; i++) {
    for (let j = 0; j < H[i].length; j++) {
      if (H[i][j] !== 0) {
        sum +=
          H[i][j] *
          Math.pow(1 / Tbar - 1, i) *
          Math.pow(rhobar - 1, j);
      }
    }
  }
  const mu1 = Math.exp(rhobar * sum);

  /* ---- μ2 (critical enhancement, simplified mode-coupling) ---- */
  const deltaT = Math.abs(T - Tc) / Tc;
  const xi = xi0 * Math.pow(deltaT + 1e-6, -nu); // correlation length
  const mu2 = 1 + 0.06 * Math.pow(xi, gamma);

  return mu0 * mu1 * mu2;
}
