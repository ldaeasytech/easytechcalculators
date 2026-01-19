// region2.js — IF97 Region 2 (Superheated / Saturated Vapor)

import { R, EPS } from "../constants.js";

export function region2(T, P) {
  const pi = P; // P / 1 MPa (dimensionless)
  const tau = 540 / T;

  let g0 = Math.log(pi), g0_tau = 0, g0_tautau = 0;

  for (let k = 0; k < n0.length; k++) {
    const t = Math.pow(tau, J0[k]);
    g0 += n0[k] * t;
    g0_tau += n0[k] * J0[k] * t / tau;
    g0_tautau += n0[k] * J0[k] * (J0[k] - 1) * t / (tau * tau);
  }

  let gr = 0, gr_pi = 0, gr_tau = 0;
  let gr_pipi = 0, gr_tautau = 0, gr_pitau = 0;

  for (let k = 0; k < nr.length; k++) {
    const piI = Math.pow(pi, Ir[k]);
    const tauJ = Math.pow(tau, Jr[k]);

    gr += nr[k] * piI * tauJ;
    gr_pi += nr[k] * Ir[k] * piI / pi * tauJ;
    gr_tau += nr[k] * Jr[k] * piI * tauJ / tau;

    gr_pipi += nr[k] * Ir[k] * (Ir[k] - 1) * piI / (pi * pi) * tauJ;
    gr_tautau += nr[k] * Jr[k] * (Jr[k] - 1) * piI * tauJ / (tau * tau);
    gr_pitau += nr[k] * Ir[k] * Jr[k] * piI / pi * tauJ / tau;
  }

  const g = g0 + gr;

  const specificVolume = (R * T / P) * (1 + gr_pi);
  const density = 1 / Math.max(specificVolume, EPS);

  const enthalpy = R * T * tau * (g0_tau + gr_tau);
  const entropy = R * (tau * (g0_tau + gr_tau) - g);

  const cp = -R * tau * tau * (g0_tautau + gr_tautau);
  const cv = cp -
    R * Math.pow(1 + gr_pi - tau * gr_pitau, 2) /
    Math.max(1 + 2 * gr_pi + pi * gr_pipi, EPS);

  return {
    region: 2,
    phase: "superheated_steam",
    T, P,
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
