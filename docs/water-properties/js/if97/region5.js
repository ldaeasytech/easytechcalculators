// IAPWS-IF97 Region 5 — High-temperature steam
// Valid: 1073.15 K ≤ T ≤ 2273.15 K, P ≤ 50 MPa

import { R } from "./constants.js";

// Ideal-gas Gibbs free energy coefficients (Region 5)
const J = [0, 1, -5, -4, -3, -2, -1, 2, 3];
const n = [
 -0.13179983674201e2,
  0.68540841634434e1,
 -0.24805148933466e-1,
  0.36901534980333,
 -0.31161318213925e1,
 -0.32961626538917,
 -0.19182746502706,
  0.16481860540611,
  0.15876121999995e1
];

export function region5(T, P) {
  // T in K, P in MPa
  const tau = 1000 / T;
  const pi = P;

  let g = Math.log(pi);
  let g_tau = 0;
  let g_tautau = 0;

  for (let i = 0; i < n.length; i++) {
    const t = Math.pow(tau, J[i]);
    g += n[i] * t;
    g_tau += n[i] * J[i] * t / tau;
    g_tautau += n[i] * J[i] * (J[i] - 1) * t / (tau * tau);
  }

  // IF97 derivatives
  const v = R * T / (P * 1000); // m³/kg
  const rho = 1 / v;

  const h = R * T * tau * g_tau;
  const s = R * (tau * g_tau - g);
  const cp = -R * tau * tau * g_tautau;
  const cv = cp - R; // valid for Region 5 ideal-gas form

  return {
    region: 5,
    phase: "high-temperature vapor",
    density: rho,
    specificVolume: v,
    enthalpy: h,
    entropy: s,
    cp,
    cv
  };
}
