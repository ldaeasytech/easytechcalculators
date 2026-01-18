// IF97 Region 3 — Dense water/steam near critical
// Valid for: 623.15 K ≤ T ≤ 863.15 K, 16.529 MPa ≤ P ≤ 100 MPa

import { R } from "./constants.js";

// Coefficients for Helmholtz free energy (simplified engineering form)
const I = [
  0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  1, 1, 1, 2, 2, 2, 2, 2, 3, 3,
  3, 4, 4, 4, 5, 5, 6, 6, 7, 7,
  7, 9, 9, 9, 9, 9, 9, 10, 10, 12
];

const J = [
  0, 1, 2, 7, 10, 12, 23, 2, 6, 15,
  17, 18, 24, 0, 1, 2, 9, 12, 1, 5,
  10, 0, 1, 8, 0, 2, 0, 2, 0, 1,
  2, 0, 1, 3, 7, 10, 11, 0, 1, 0
];

const n = [
  0.10658070028513e1,
 -0.15732845290239e2,
  0.20944396974307e2,
 -0.76867707878716e1,
  0.26185947787954e1,
 -0.28080781148620e1,
  0.12053369696517e1,
 -0.84566812812502e-2,
 -0.12654315477714e1,
 -0.11524407806681e1,
  0.88521043984318,
 -0.64207765181607,
  0.38493460186671,
 -0.85214708824206,
  0.48972281541877,
 -0.30502617256965,
  0.39420536879154,
  0.12558408424308,
 -0.27999329698710,
  0.13899799569460,
 -0.20189915023570,
 -0.82147637173963e-2,
 -0.47596035734923,
  0.43984074473500,
 -0.44476435428739,
  0.90572070719733,
  0.70522450087967,
  0.10770512626332,
 -0.32913623258954,
  0.50871062041158,
 -0.22175400873096,
  0.94260751665092e-1,
  0.16436278447961,
 -0.13503372241348,
 -0.14834345352472,
  0.57922953628084,
  0.89238728211196e-1,
  0.76345222912855e-1,
 -0.56875616484721e-1,
 -0.62497382974507e-1
];

// Critical density
const rhoc = 322; // kg/m³
const Tc = 647.096;

export function props(T, P) {
  // Convert P to MPa
  const pMPa = P / 1e6;

  // Initial density guess (engineering-grade approximation)
  let rho = 700; // kg/m³

  // Newton-Raphson iteration to solve p(T,ρ)
  for (let iter = 0; iter < 50; iter++) {
    const delta = rho / rhoc;
    const tau = Tc / T;

    let phi_delta = 0;
    let phi_delta2 = 0;

    for (let k = 0; k < n.length; k++) {
      const term = n[k] * Math.pow(delta, I[k]) * Math.pow(tau, J[k]);
      phi_delta += term * I[k] / delta;
      phi_delta2 += term * I[k] * (I[k] - 1) / (delta * delta);
    }

    const p_calc = delta * phi_delta * rho * R * T / 1e3; // MPa
    const dpdrho = (R * T / 1e3) * (phi_delta + delta * phi_delta2);

    const f = p_calc - pMPa;
    if (Math.abs(f) < 1e-6) break;

    rho -= f / dpdrho;
    rho = Math.max(1, rho);
  }

  const delta = rho / rhoc;
  const tau = Tc / T;

  let phi = 0;
  let phi_tau = 0;
  let phi_delta = 0;
  let phi_tautau = 0;
  let phi_deltadelta = 0;
  let phi_deltatau = 0;

  for (let k = 0; k < n.length; k++) {
    const term = n[k] * Math.pow(delta, I[k]) * Math.pow(tau, J[k]);
    phi += term;
    phi_tau += term * J[k] / tau;
    phi_delta += term * I[k] / delta;
    phi_tautau += term * J[k] * (J[k] - 1) / (tau * tau);
    phi_deltadelta += term * I[k] * (I[k] - 1) / (delta * delta);
    phi_deltatau += term * I[k] * J[k] / (delta * tau);
  }

  const h = R * T * (tau * phi_tau + delta * phi_delta);
  const s = R * (tau * phi_tau - phi);
  const cv = -R * tau * tau * phi_tautau;
  const cp = cv + R * Math.pow(1 + delta * phi_delta - delta * tau * phi_deltatau, 2) /
    (1 + 2 * delta * phi_delta + delta * delta * phi_deltadelta);

  return {
    density: rho,
    specificVolume: 1 / rho,
    enthalpy: h,
    entropy: s,
    cp,
    cv
  };
}
