// IF97 Region 5 — High-temperature superheated steam
// Valid for: 1073.15 K ≤ T ≤ 2273.15 K, P ≤ 50 MPa

import { R } from "./constants.js";

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

export function props(T, P) {
  const tau = 1000 / T;
  const pi = P / 1e6; // MPa

  let gamma = Math.log(pi);
  let gamma_tau = 0;
  let gamma_pi = 1 / pi;
  let gamma_tautau = 0;
  let gamma_pipi = -1 / (pi * pi);
  let gamma_pitau = 0;

  for (let k = 0; k < n.length; k++) {
    const term = n[k] * Math.pow(tau, J[k]);
    gamma += term;
    gamma_tau += term * J[k] / tau;
    gamma_tautau += term * J[k] * (J[k] - 1) / (tau * tau);
  }

  const v = R * T * pi / P; // m³/kg
  const rho = 1 / v;

  const h = R * T * tau * gamma_tau;
  const s = R * (tau * gamma_tau - gamma);
  const cp = -R * tau * tau * gamma_tautau;
  const cv = cp - R;

  return {
    density: rho,
    specificVolume: v,
    enthalpy: h,
    entropy: s,
    cp,
    cv
  };
}
