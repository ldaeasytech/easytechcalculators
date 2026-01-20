// region2.js — IF97 Region 2 (Superheated / Saturated Vapor)

import { R, EPS } from "../constants.js";

/* Ideal-gas part coefficients */
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

/* Residual part coefficients */
const Ir = [
  1,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,5,6,6,7,7,9,9
];
const Jr = [
  0,1,2,3,6,1,2,4,7,36,0,1,3,6,0,1,7,0,1,3,0,7,1,2
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
  2.0481737692309e-08,
  4.3870667284435e-07,
  -0.000032277677238570,
  -0.0015033924542148,
  -0.040668253562649,
  -7.8847309559367e-10,
  1.2790717852285e-08,
  4.8225372718507e-07,
  2.2922076337661e-06,
  -1.6714766451061e-11,
  -0.0021171472321355,
  -23.895741934104,
  -5.9059564324270e-18,
  -1.2621808899101e-06
];

export function region2(T, P) {
  const pi = P;
  const tau = 540 / T;

  let g0 = Math.log(pi);
  let g0t = 0, g0tt = 0;

  for (let k = 0; k < n0.length; k++) {
    const t = Math.pow(tau, J0[k]);
    g0 += n0[k] * t;
    g0t += n0[k] * J0[k] * t / tau;
    g0tt += n0[k] * J0[k] * (J0[k] - 1) * t / (tau * tau);
  }

  let gr = 0, grp = 0, grpp = 0, grt = 0, grtt = 0, grpt = 0;

  for (let k = 0; k < nr.length; k++) {
    const piI = Math.pow(pi, Ir[k]);
    const tauJ = Math.pow(tau, Jr[k]);

    gr += nr[k] * piI * tauJ;
    grp += nr[k] * Ir[k] * piI * tauJ / pi;
    grpp += nr[k] * Ir[k] * (Ir[k] - 1) * piI * tauJ / (pi * pi);
    grt += nr[k] * Jr[k] * piI * tauJ / tau;
    grtt += nr[k] * Jr[k] * (Jr[k] - 1) * piI * tauJ / (tau * tau);
    grpt += nr[k] * Ir[k] * Jr[k] * piI * tauJ / (pi * tau);
  }

  // === SPECIFIC VOLUME (kJ + MPa → m³/kg needs 1e-3) ===
  const specificVolume = 1e-3 * (R * T / P) * (1 + grp);
  const density = 1 / Math.max(specificVolume, EPS);

  const enthalpy = R * T * tau * (g0t + grt);
  const entropy = R * (tau * (g0t + grt) - (g0 + gr));
  const cp = -R * tau * tau * (g0tt + grtt);

  // === CORRECTED Cv (unit-safe & guarded) ===
  const denom = 1 + 2 * grp + pi * grpp;
  const correction =
    denom > EPS
      ? (1e-3 * R *
         Math.pow(1 + grp - tau * grpt, 2) / denom)
      : 0;

  const cv = Math.max(cp - correction, EPS);

  return {
    region: 2,
    phase: "superheated_vapor",
    T,
    P,
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
