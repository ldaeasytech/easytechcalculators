// region3.js — IF97 Region 3 (Dense Fluid)

import { R, Tc, rhoc, EPS } from "../constants.js";

export function region3(T, P) {
  let rho = rhoc; // safer initial guess

  for (let iter = 0; iter < 50; iter++) {
    const delta = rho / rhoc;
    const tau = Tc / T;

    let phi_d = 0, phi_dd = 0;

    for (let k = 0; k < n.length; k++) {
      const d = Math.pow(delta, I[k]);
      const t = Math.pow(tau, J[k]);
      phi_d += n[k] * I[k] * d * t / delta;
      phi_dd += n[k] * I[k] * (I[k] - 1) * d * t / (delta * delta);
    }

    const pCalc = rho * R * T * (1 + delta * phi_d) / 1000;
    const dpdrho = R * T *
      (1 + 2 * delta * phi_d + delta * delta * phi_dd) / 1000;

    const err = pCalc - P;
    if (Math.abs(err) < 1e-7) break;

    rho -= err / Math.max(dpdrho, EPS);
    rho = Math.max(rho, 1);
  }

  const delta = rho / rhoc;
  const tau = Tc / T;

  let phi = 0, phi_d = 0, phi_dd = 0, phi_t = 0, phi_tt = 0, phi_dt = 0;

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

  const enthalpy = R * T * (tau * phi_t + delta * phi_d);
  const entropy = R * (tau * phi_t - phi);
  const cv = -R * tau * tau * phi_tt;
  const cp = cv + R *
    Math.pow(1 + delta * phi_d - delta * tau * phi_dt, 2) /
    Math.max(1 + 2 * delta * phi_d + delta * delta * phi_dd, EPS);

  return {
    region: 3,
    phase: "dense_fluid",
    density: rho,
    specificVolume: 1 / rho,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
