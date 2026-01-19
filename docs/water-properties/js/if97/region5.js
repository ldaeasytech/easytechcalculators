// region5.js — IF97 Region 5 (High-T Steam)

import { R, EPS } from "../constants.js";

export function region5(T, P) {
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

  const specificVolume = R * T / P;
  const density = 1 / Math.max(specificVolume, EPS);

  const enthalpy = R * T * tau * g_tau;
  const entropy = R * (tau * g_tau - g);
  const cp = -R * tau * tau * g_tautau;
  const cv = cp - R;

  return {
    region: 5,
    phase: "high_temperature_steam",
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
