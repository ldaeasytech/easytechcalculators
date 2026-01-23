// region4.js — IF97 Region 4 (Saturation curve)
//
// Units:
//   T → K
//   P → MPa
//
// Design:
//   - Tsat(P): authoritative IF97 inversion (UNCHANGED)
//   - Psat(T): numerically stable Wagner-type correlation
//

import { EPS } from "../constants.js";

/* ============================================================
   IF97 Region-4 coefficients (official)
   Used ONLY inside Tsat(P)
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

// IF97 limits
const T_TRIPLE = 273.16;       // K
const T_CRIT   = 647.096;     // K
const P_TRIPLE = 0.000611657; // MPa
const P_CRIT   = 22.064;      // MPa

/* ============================================================
   Tsat(P) — saturation temperature from pressure
   (VALIDATED IF97 INVERSION — UNCHANGED)
   P in MPa → T in K
   ============================================================ */

export function Tsat(P) {
  if (P < P_TRIPLE || P > P_CRIT) return NaN;

  let Tlow = T_TRIPLE;
  let Thigh = T_CRIT;

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

    if (Math.abs(Psat_mid - P) < 1e-7) return Tmid;

    Psat_mid > P ? (Thigh = Tmid) : (Tlow = Tmid);
  }

  return 0.5 * (Tlow + Thigh);
}

/* ============================================================
   Psat(T) — saturation pressure from temperature
   (WAGNER-TYPE CORRELATION)
   T in K → P in MPa
   ============================================================ */

export function Psat(T) {
  if (T < T_TRIPLE || T > T_CRIT) return NaN;

  const Tc = T_CRIT;
  const Pc = P_CRIT;

  // Reduced temperature
  let tau = 1 - T / Tc;

  // Numerical safeguard near critical point
  tau = Math.max(tau, 1e-12);

  // Wagner-type coefficients
  // NOTE: These should be replaced with YOUR fitted values
  const a1 = -7.85951783;
  const a2 =  1.84408259;
  const a3 = -11.7866497;
  const a4 =  22.6807411;

  const exponent =
    (Tc / T) *
    (
      a1 * tau +
      a2 * Math.pow(tau, 1.5) +
      a3 * Math.pow(tau, 3.0) +
      a4 * Math.pow(tau, 3.5)
    );

  return Pc * Math.exp(exponent);
}
