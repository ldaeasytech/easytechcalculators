// region2.js — IF97 Region 2 (Superheated Steam)
// Fully IF97-compliant, explicit, non-iterative

import { R, EPS } from "../constants.js";
import { Psat } from "./region4.js";

/* ============================================================
   Ideal-gas part coefficients (IF97)
   ============================================================ */

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

/* ============================================================
   Residual part coefficients (OFFICIAL IF97 TABLE)
   Each row is a strict (Ir, Jr, nr) triplet
   ============================================================ */

const RES = [
  [1,  0, -0.0017731742473213],
  [1,  1, -0.017834862292358],
  [1,  2, -0.045996013696365],
  [1,  3, -0.057581259083432],
  [1,  6, -0.050325278727930],
  [2,  1, -0.000033032641670203],
  [2,  2, -0.00018948987516315],
  [2,  4, -0.0039392777243355],
  [2,  7, -0.043797295650573],
  [2, 36, -0.000026674547914087],
  [3,  0,  2.0481737692309e-08],
  [3,  1,  4.3870667284435e-07],
  [3,  3, -0.000032277677238570],
  [3,  6, -0.0015033924542148],
  [4,  0, -0.040668253562649],
  [4,  1, -7.8847309559367e-10],
  [4,  7,  1.2790717852285e-08],
  [5,  0,  4.8225372718507e-07],
  [6,  1,  2.2922076337661e-06],
  [6,  3, -1.6714766451061e-11],
  [7,  0, -0.0021171472321355],
  [7,  7, -23.895741934104],
  [9,  1, -5.9059564324270e-18],
  [9,  2, -1.2621808899101e-06]
];

/* ============================================================
   Region 2 evaluator
   ============================================================ */

export function region2(T, P) {

  // --- Saturation guard ---
  if (Math.abs(P - Psat(T)) < 1e-6) {
    throw new Error("Region 2 called at saturation — use Region 4");
  }

  // --- Reduced variables ---
  const pi = P;           // p* = 1 MPa
  const tau = 540 / T;
  const theta = tau - 0.5;

  /* ---------------- Ideal-gas part ---------------- */

  let g0 = Math.log(pi);
  let g0t = 0;
  let g0tt = 0;

  for (let k = 0; k < n0.length; k++) {
    const t = Math.pow(tau, J0[k]);
    g0   += n0[k] * t;
    g0t  += n0[k] * J0[k] * t / tau;
    g0tt += n0[k] * J0[k] * (J0[k] - 1) * t / (tau * tau);
  }

  /* ---------------- Residual part ---------------- */

  let gr = 0;
  let grp = 0;
  let grpp = 0;
  let grt = 0;
  let grtt = 0;
  let grpt = 0;

  for (const [Ir, Jr, nr] of RES) {
    const piI = Math.pow(pi, Ir);
    const thJ = Math.pow(theta, Jr);

    gr   += nr * piI * thJ;
    grp  += nr * Ir * piI * thJ / pi;
    grpp += nr * Ir * (Ir - 1) * piI * thJ / (pi * pi);
    grt  += nr * Jr * piI * thJ / theta;
    grtt += nr * Jr * (Jr - 1) * piI * thJ / (theta * theta);
    grpt += nr * Ir * Jr * piI * thJ / (pi * theta);
  }

const term = nr * Ir * Math.pow(theta, Jr);
console.log({ Ir, Jr, nr, term });
grp += term;

   
  /* ---------------- Properties ---------------- */

  // Specific volume (explicit IF97 form)
  const gamma_pi = 1 / pi + grp;
  const specificVolume =
    (R * T / (P * 1000)) * pi * gamma_pi;

   if (specificVolume <= 0 || !isFinite(specificVolume)) {
  console.error("Region 2 volume error", {
    T, P, pi, tau, grp, specificVolume
  });
}


  if (specificVolume <= 0 || !isFinite(specificVolume)) {
    throw new Error("Region 2 specific volume invalid");
  }

  const density = 1 / specificVolume;

  const enthalpy =
    R * T * tau * (g0t + grt);

  const entropy =
    R * (tau * (g0t + grt) - (g0 + gr));

  const cp =
    -R * tau * tau * (g0tt + grtt);

  const denom =
    1 + 2 * pi * grp + pi * pi * grpp;

  const cv =
    denom > EPS
      ? cp - (R * Math.pow(1 + pi * grp - tau * grpt, 2)) / denom
      : cp;

  return {
    region: 2,
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
