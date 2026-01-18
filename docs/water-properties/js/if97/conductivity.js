// IAPWS 2011 formulation for thermal conductivity of water and steam
// Valid for: 273.15 K ≤ T ≤ 1173.15 K, p ≤ 100 MPa
// Returns thermal conductivity in W/(m·K)

const L = [
  [1.60397357, 2.33771842, 2.19650529, -1.21051378, -2.7203370],
  [2.78843778, -1.64647687, -2.91093611, 1.55548907, 0.0],
  [-1.44448404, 0.51692508, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0]
];

const I = [0, 1, 2, 3];
const J = [0, 1, 2, 3, 4];

const rhoc = 322; // kg/m³
const Tc = 647.096;

export function conductivity(T, rho) {
  const Tbar = T / Tc;
  const rhobar = rho / rhoc;

  // Ideal gas contribution λ0
  const lambda0 =
    1.67752 +
    2.20462 / Tbar +
    0.6366564 / (Tbar * Tbar) -
    0.241605 / (Tbar * Tbar * Tbar);

  // Residual contribution λ1
  let sum = 0;
  for (let i = 0; i < I.length; i++) {
    for (let j = 0; j < J.length; j++) {
      sum += L[i][j] * Math.pow(1 / Tbar - 1, I[i]) * Math.pow(rhobar - 1, J[j]);
    }
  }
  const lambda1 = Math.exp(rhobar * sum);

  // No critical enhancement term λ2 (optional near critical)

  return lambda0 * lambda1; // W/(m·K)
}
