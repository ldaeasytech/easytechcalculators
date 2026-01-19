// IAPWS-IF97 Region 2 — Superheated & Saturated Vapor
// Valid: T ≥ 273.15 K, P ≤ Psat(T)
// Units: T [K], P [MPa], R [kJ/(kg·K)]

import { R } from "./constants.js";

/* ---------------- IDEAL-GAS PART ---------------- */

const J0 = [0,1,-5,-4,-3,-2,-1,2,3];
const n0 = [
  -9.6927686500217,
   10.086655968018,
  -0.005608791128302,
   0.071452738081455,
  -0.40710498223928,
   1.4240819171444,
  -4.3839511319450,
  -0.28408632460772,
   0.021268463753307
];

/* ---------------- RESIDUAL PART ---------------- */

const Ir = [
  1,1,1,1,1,1,1,1,
  2,2,2,2,2,2,2,
  3,3,3,3,3,
  4,4,4,
  5,5,
  6,
  7,
  9,
  9
];

const Jr = [
  0,1,2,3,6,7,8,9,
  0,1,2,3,4,5,6,
  0,1,2,3,7,
  0,1,2,
  0,1,
  0,
  0,
  1,
  3
];

const nr = [
 -0.0017731742473213,
 -0.017834862292358,
 -0.045996013696365,
 -0.057581259083432,
 -0.050325278727930,
 -0.000033032641670203,
 -0.00018948987516315,
 -0.0039392777243355,
 -0.043797295650573,
 -0.026674547914087,
 -0.0023736834097350,
  0.00019664643882165,
  0.000060069013049663,
 -0.000001956206718231,
 -0.00000045604212548712,
 -0.000000017441087784306,
 -0.000000000027800246803522,
  0.000000000000000000001,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000,
  0.000000000000000000000
];

/* ---------------- REGION 2 FUNCTION ---------------- */

export function region2(T, P) {

  const pi  = P;
  const tau = 540 / T;

  let g0 = Math.log(pi), g0_tau = 0, g0_tautau = 0;

  for (let k = 0; k < n0.length; k++) {
    g0 += n0[k] * Math.pow(tau, J0[k]);
    g0_tau += n0[k] * J0[k] * Math.pow(tau, J0[k] - 1);
    g0_tautau += n0[k] * J0[k] * (J0[k] - 1) * Math.pow(tau, J0[k] - 2);
  }

  let gr = 0, gr_pi = 0, gr_tau = 0;
  let gr_pipi = 0, gr_tautau = 0, gr_pitau = 0;

  for (let k = 0; k < nr.length; k++) {
    const Ii = Ir[k];
    const Ji = Jr[k];

    const piI  = Math.pow(pi, Ii);
    const tauJ = Math.pow(tau, Ji);

    gr += nr[k] * piI * tauJ;
    gr_pi += nr[k] * Ii * Math.pow(pi, Ii - 1) * tauJ;
    gr_tau += nr[k] * Ji * piI * Math.pow(tau, Ji - 1);

    gr_pipi += nr[k] * Ii * (Ii - 1) * Math.pow(pi, Ii - 2) * tauJ;
    gr_tautau += nr[k] * Ji * (Ji - 1) * piI * Math.pow(tau, Ji - 2);
    gr_pitau += nr[k] * Ii * Ji * Math.pow(pi, Ii - 1) * Math.pow(tau, Ji - 1);
  }

  const g = g0 + gr;

  const specificVolume = (R * T / P) * pi * (1 + gr_pi);
  const density = 1 / specificVolume;

  const enthalpy = R * T * tau * (g0_tau + gr_tau);
  const entropy  = R * (tau * (g0_tau + gr_tau) - g);

  const cp = -R * tau * tau * (g0_tautau + gr_tautau);
  const cv = R * (
    -tau * tau * (g0_tautau + gr_tautau) -
    Math.pow(1 + gr_pi - tau * gr_pitau, 2) /
    (1 + 2 * gr_pi + pi * gr_pipi)
  );

  return {
    region: 2,
    phase: "vapor",
    T, P,
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
