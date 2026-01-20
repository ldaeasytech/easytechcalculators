// region3.js — IF97 Region 3 (Dense Fluid)

import { R, Tc, rhoc, EPS } from "../constants.js";

/* IAPWS-IF97 Region 3 coefficients */
const I = [
  0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,3,3,3,4,4,4,5,8
];
const J = [
  0,1,2,7,10,12,23,24,2,6,15,17,18,24,0,2,6,7,22,0,2,16,0,2,4,2,0
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
  0.39420536879154e-1,
  0.12558408424308,
 -0.27999329698710,
  0.13899799569460,
 -0.20189915023570,
 -0.82147637173963e-2,
 -0.47596035734923,
  0.43984074473500e-1,
 -0.44476435428739e-1,
  0.90572070719733,
  0.70522450087967
];

export function region3(T, P) {
  let rho = rhoc;

  for (let i = 0; i < 60; i++) {
    const delta = rho / rhoc;
    const tau = Tc / T;

    let phid = 0, phidd = 0;

    for (let k = 0; k < n.length; k++) {
      const d = Math.pow(delta, I[k]);
      const t = Math.pow(tau, J[k]);
      phid += n[k] * I[k] * d * t / delta;
      phidd += n[k] * I[k] * (I[k] - 1) * d * t / (delta * delta);
    }

    const pCalc = rho * R * T * (1 + delta * phid) / 1000;
    const dpdrho =
      R * T * (1 + 2 * delta * phid + delta * delta * phidd) / 1000;

    if (!Number.isFinite(dpdrho) || dpdrho < EPS) break;

    const dr = (pCalc - P) / dpdrho;
    rho = Math.max(rho - dr, 1);

    if (Math.abs(dr / rho) < 1e-8) break;
  }

  const delta = rho / rhoc;
  const tau = Tc / T;

  let phi = 0, phid = 0, phidd = 0, phit = 0, phitt = 0, phidt = 0;

  for (let k = 0; k < n.length; k++) {
    const d = Math.pow(delta, I[k]);
    const t = Math.pow(tau, J[k]);
    phi += n[k] * d * t;
    phid += n[k] * I[k] * d * t / delta;
    phidd += n[k] * I[k] * (I[k] - 1) * d * t / (delta * delta);
    phit += n[k] * J[k] * d * t / tau;
    phitt += n[k] * J[k] * (J[k] - 1) * d * t / (tau * tau);
    phidt += n[k] * I[k] * J[k] * d * t / (delta * tau);
  }

  const enthalpy = R * T * (tau * phit + delta * phid);
  const entropy = R * (tau * phit - phi);
  const cv = -R * tau * tau * phitt;
  const cp =
    cv +
    R *
      Math.pow(1 + delta * phid - delta * tau * phidt, 2) /
      Math.max(1 + 2 * delta * phid + delta * delta * phidd, EPS);

  return {
    region: 3,
    phase: "dense_fluid",
    T,
    P,
    density: rho,
    specificVolume: 1 / rho,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
