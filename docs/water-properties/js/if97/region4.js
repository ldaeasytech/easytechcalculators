// region4.js — IF97 Region 4 (Saturation curve)
// FINAL: Tsat(P) kept as-is, Psat(T) uses verified IF97 polynomial

import { EPS } from "../constants.js";

/* ============================================================
   IAPWS IF97 saturation coefficients (official)
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

// IF97 validity limits
const T_TRIPLE = 273.16;    // K
const T_CRIT   = 647.096;  // K
const P_CRIT   = 22.064;   // MPa

/* ============================================================
   Tsat(P) — saturation temperature from pressure
   (UNCHANGED — your validated implementation)
   P in MPa → T in K
   ============================================================ */

export function Tsat(P) {
  let Tlow = 273.15;   // K
  let Thigh = 647.096; // K

  for (let i = 0; i < 80; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);

    const theta = Tmid + n[8] / (Tmid - n[9]);

    const A = theta * theta + n[0] * theta + n[1];
    const B = n[2] * theta * theta + n[3] * theta + n[4];
    const C = n[5] * theta * theta + n[6] * theta + n[7];

    const D = Math.max(B * B - 4 * A * C, EPS);

    const Psat_mid = Math.pow(
      (2 * C) / (-B + Math.sqrt(D)),
      4
    );

    if (Math.abs(Psat_mid - P) < EPS) return Tmid;

    Psat_mid > P ? (Thigh = Tmid) : (Tlow = Tmid);
  }

  return NaN;
}

/* ============================================================
   Psat(T) — saturation pressure from temperature
   (VERIFIED IF97 POLYNOMIAL)
   T in K → P in MPa
   ============================================================ */

export function Psat(T) {
  if (T < T_TRIPLE || T > T_CRIT) return NaN;

  const theta = T + n[8] / (T - n[9]);

  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];

  const D = B * B - 4 * A * C;
  if (D < 0) return NaN;

  const P = Math.pow(
    (2 * C) / (-B + Math.sqrt(D)),
    4
  );

  // Guard against tiny numerical overshoots
  return P > P_CRIT ? NaN : P;
}
