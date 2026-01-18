// IAPWS-IF97 Region 3 — Dense fluid (Helmholtz formulation)
// Pressure: MPa, Temperature: K

import { R } from "./constants.js";

const rhoc = 322;        // kg/m³
const Tc = 647.096;

// IF97 Region 3 residual Helmholtz coefficients (official set)
const I = [
  0,0,0,0,0,0,0,1,1,1,
  1,1,1,2,2,2,2,2,3,3,
  3,4,4,4,5,5,6,6,7,7,
  7,9,9,9,9,9,9,10,10,12
];

const J = [
  0,1,2,7,10,12,23,2,6,15,
  17,18,24,0,1,2,9,12,1,5,
  10,0,1,8,0,2,0,2,0,1,
  2,0,1,3,7,10,11,0,1,0
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

export function region3(T, P) {
  // P in MPa
  let rho = 500; // better global initial guess

  for (let iter = 0; iter < 40; iter++) {
    const delta = rho / rhoc;
    const tau = Tc / T;

    let phi_d = 0;
    let phi_dd = 0;

    for (let k = 0; k < n.length; k++) {
      const d = Math.pow(delta, I[k]);
      const t = Math.pow(tau, J[k]);
      phi_d += n[k] * I[k] * d * t / delta;
      phi_dd += n[k] * I[k] * (I[k] - 1) * d * t / (delta * delta);
    }

    const p_calc = rho * R * T * (1 + delta * phi_d) / 1000; // MPa
    const dpdrho = R * T * (1 + 2 * delta * phi_d + delta * delta * phi_dd) / 1000;

    const f = p_calc - P;
    if (Math.abs(f) < 1e-8) break;

    rho -= f / dpdrho;
    rho = Math.max(1, rho);
  }

  const delta = rho / rhoc;
  const tau = Tc / T;

  let phi = 0, phi_t = 0, phi_tt = 0;
  let phi_d = 0, phi_dd = 0, phi_dt = 0;

  for (let k = 0; k < n.length; k++) {
    const d = Math.pow(delta, I[k]);
    const t = Math.pow(tau, J[k]);
    phi += n[k] * d * t;
    phi_d += n[k] * I[k] * d * t / delta;
    phi_dd += n[k] * I[k] * (I[k] - 1) * d * t / (delta * delta);
    phi_t += n[k] * J[k] * d * t / tau;
    phi_tt += n[k] * J[k] * (J[k] - 1) * d * t / (tau * tau);
    phi_dt += n[k] * I[k] * J[k] * d * t / (delta * tau);
  }

  const h = R * T * (tau * phi_t + delta * phi_d);
  const s = R * (tau * phi_t - phi);
  const cv = -R * tau * tau * phi_tt;
  const cp = cv + R *
    Math.pow(1 + delta * phi_d - delta * tau * phi_dt, 2) /
    (1 + 2 * delta * phi_d + delta * delta * phi_dd);

  return {
    region: 3,
    phase: "dense fluid",
    density: rho,
    specificVolume: 1 / rho,
    enthalpy: h,
    entropy: s,
    cp,
    cv
  };
}
