// IAPWS-IF97 Region 2 (superheated steam)

import { R } from './constants.js';

/* ---------- Ideal-gas part γ0 ---------- */
const J0 = [0, 1, -5, -4, -3, -2, -1, 2, 3];
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

/* ---------- Residual part γr ---------- */
const Ir = [
  1, 1, 1, 1, 1, 2, 2, 2,
  3, 3, 4, 4, 5, 6, 6, 7,
  7, 7, 7, 7, 7, 7, 7
];

const Jr = [
  0, 1, 2, 3, 6, 1, 2, 4,
  0, 1, 0, 3, 1, 3, 5, 0,
  1, 2, 3, 4, 5, 6, 7
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
 -0.000026674547914087,
  0.00000020481737692309,
  0.0000043870667284435,
 -0.0000003227767723857,
 -0.0000000015033924542148,
 -0.000000040668253562649,
 -0.00000000078847309559367,
  0.00000000012790717852285,
  0.00000000048225372718507,
  0.00000000022922076337661,
 -0.000000000016532221860421,
 -0.000000000014022463197699,
 -0.0000000000035362181035732,
  0.00000000000028138212038271
];

export function region2(T, P) {
  const pi = P;
  const tau = 540 / T;

  let g0 = Math.log(pi), g0_tau = 0, g0_tautau = 0;

  for (let i = 0; i < n0.length; i++) {
    g0 += n0[i] * Math.pow(tau, J0[i]);
    g0_tau += n0[i] * J0[i] * Math.pow(tau, J0[i] - 1);
    g0_tautau += n0[i] * J0[i] * (J0[i] - 1) * Math.pow(tau, J0[i] - 2);
  }

  let gr = 0, gr_pi = 0, gr_pipi = 0;
  let gr_tau = 0, gr_tautau = 0, gr_pitau = 0;

  for (let i = 0; i < nr.length; i++) {
    const Ii = Ir[i];
    const Ji = Jr[i];
    const term = nr[i] * Math.pow(pi, Ii) * Math.pow(tau - 0.5, Ji);

    gr += term;
    gr_pi += nr[i] * Ii * Math.pow(pi, Ii - 1) * Math.pow(tau - 0.5, Ji);
    gr_pipi += nr[i] * Ii * (Ii - 1) * Math.pow(pi, Ii - 2) * Math.pow(tau - 0.5, Ji);
    gr_tau += nr[i] * Ji * Math.pow(pi, Ii) * Math.pow(tau - 0.5, Ji - 1);
    gr_tautau += nr[i] * Ji * (Ji - 1) * Math.pow(pi, Ii) * Math.pow(tau - 0.5, Ji - 2);
    gr_pitau += nr[i] * Ii * Ji * Math.pow(pi, Ii - 1) * Math.pow(tau - 0.5, Ji - 1);
  }

  const v = R * T / (P * 1000) * pi * (1 + gr_pi);
  const rho = 1 / v;

  const h = R * T * tau * (g0_tau + gr_tau);
  const s = R * (tau * (g0_tau + gr_tau) - (g0 + gr));

  const cp = -R * tau * tau * (g0_tautau + gr_tautau);
  const cv = R * (
    -tau * tau * (g0_tautau + gr_tautau) -
    Math.pow(1 + pi * gr_pi - tau * pi * gr_pitau, 2) /
    (1 - pi * pi * gr_pipi)
  );

  return {
    region: 2,
    phase: 'superheated vapor',
    T,
    P,
    density: rho,
    specificVolume: v,
    enthalpy: h,
    entropy: s,
    cp,
    cv
  };
}
