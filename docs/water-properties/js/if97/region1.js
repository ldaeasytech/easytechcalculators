// region1.js — IF97 Region 1 (Compressed/Subcooled Liquid)

import { R, EPS } from "./constants.js";

export function region1(T, P) {
  const pi = P / 16.53;
  const tau = 1386 / T;

  let g = 0, g_pi = 0, g_tau = 0;
  let g_pipi = 0, g_tautau = 0, g_pitau = 0;

  for (let k = 0; k < n.length; k++) {
    const dpi = 7.1 - pi;
    const dtau = tau - 1.222;

    const Ii = I[k];
    const Ji = J[k];

    const dpiI = Math.pow(dpi, Ii);
    const dtauJ = Math.pow(dtau, Ji);

    g += n[k] * dpiI * dtauJ;
    g_pi += -n[k] * Ii * Math.pow(dpi, Ii - 1) * dtauJ;
    g_tau += n[k] * Ji * dpiI * Math.pow(dtau, Ji - 1);

    g_pipi += n[k] * Ii * (Ii - 1) * Math.pow(dpi, Ii - 2) * dtauJ;
    g_tautau += n[k] * Ji * (Ji - 1) * dpiI * Math.pow(dtau, Ji - 2);
    g_pitau += -n[k] * Ii * Ji *
               Math.pow(dpi, Ii - 1) *
               Math.pow(dtau, Ji - 1);
  }

  const specificVolume = (R * T / P) * (-g_pi);
  const density = 1 / Math.max(specificVolume, EPS);

  const enthalpy = R * T * tau * g_tau;
  const entropy = R * (tau * g_tau - g);

  const cp = -R * tau * tau * g_tautau;
  const cv = R * (
    -tau * tau * g_tautau +
    Math.pow(g_pi - tau * g_pitau, 2) /
    Math.max(g_pipi, EPS)
  );

  return {
    region: 1,
    phase: "subcooled_liquid",
    T, P,
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
