// region3.js — IF97 Region 3 (Dense Fluid)

import { R, Tc, rhoc, EPS } from "../constants.js";

/* Full IF97 Region 3 coefficient arrays required */
import { n, I, J } from "./region3_coeffs.js";

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

    const pcalc = rho * R * T * (1 + delta * phid) / 1000;
    const dpdrho =
      R * T * (1 + 2 * delta * phid + delta * delta * phidd) / 1000;

    if (!Number.isFinite(dpdrho) || dpdrho < EPS) break;

    const dr = (pcalc - P) / dpdrho;
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
    T, P,
    density: rho,
    specificVolume: 1 / rho,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
