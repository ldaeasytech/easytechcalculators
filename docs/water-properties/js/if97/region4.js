// region4.js — IF97 Region 4 (Saturation curve)
// FINAL: numerically stable, inversion-based Psat(T)

import { EPS } from "../constants.js";

/* ============================================================
   IAPWS IF97 saturation coefficients (for Tsat(P))
   ============================================================ */

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

/* ============================================================
   Tsat(P) — saturation temperature from pressure
   P in MPa → T in K
   ============================================================ */

export function Tsat(P) {
  // Valid IF97 saturation range
  let Tlow = 273.15;   // K
  let Thigh = 647.096; // K

  for (let i = 0; i < 80; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);

    const theta = Tmid + n[8] / (Tmid - n[9]);

    const A = theta * theta + n[0] * theta + n[1];
    const B = n[2] * theta * theta + n[3] * theta + n[4];
    const C = n[5] * theta * theta + n[6] * theta + n[7];

    const Psat_mid = Math.pow(
      (2 * C) / (-B + Math.sqrt(Math.max(B * B - 4 * A * C, EPS))),
      4
    );

    if (Math.abs(Psat_mid - P) < EPS) return Tmid;

    Psat_mid > P ? (Thigh = Tmid) : (Tlow = Tmid);
  }

  return NaN;
}

/* ============================================================
   Psat(T) — saturation pressure from temperature
   T in K → P in MPa
   (ROBUST inversion of Tsat(P))
   ============================================================ */

export function Psat(T) {
  // Valid IF97 saturation pressure range
  let Plow = 1e-6;    // MPa
  let Phigh = 22.064; // MPa (critical pressure)

  for (let i = 0; i < 80; i++) {
    const Pmid = 0.5 * (Plow + Phigh);
    const Tmid = Tsat(Pmid);

    if (!Number.isFinite(Tmid)) break;

    if (Math.abs(Tmid - T) < 1e-7) return Pmid;

    Tmid > T ? (Phigh = Pmid) : (Plow = Pmid);
  }

  return NaN;
}
