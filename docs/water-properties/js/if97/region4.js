// region4.js — IF97 Saturation Line

import { EPS } from "../constants.js";

const n = [
  0.11670521452767e4,
  -0.72421316703206e6,
  -0.17073846940092e2,
  0.12020824702470e5,
  -0.32325550322333e7,
  0.14915108613530e2,
  -0.48232657361591e4,
  0.40511340542057e6,
  -0.23855557567849,
  0.65017534844798e3
];

export function Psat(T) {
  const theta = T + n[8] / (T - n[9]);

  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];

  return Math.pow((2 * C) / (-B + Math.sqrt(Math.max(B * B - 4 * A * C, EPS))), 4);
}

export function Tsat(P) {
  let Tlow = 273.15;
  let Thigh = 647.096;

  for (let i = 0; i < 60; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);
    const f = Psat(Tmid) - P;
    if (Math.abs(f) < EPS) return Tmid;
    f > 0 ? (Thigh = Tmid) : (Tlow = Tmid);
  }
  return NaN;
}
