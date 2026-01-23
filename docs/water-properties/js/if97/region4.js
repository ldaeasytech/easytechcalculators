// region4.js — IF97 Region 4 (Saturation curve)
//
// Units:
//   T → K
//   P → MPa
//
// Design:
//   - Tsat_IF97(P): authoritative IF97 inversion (exact)
//   - Tsat(P): piece-wise quadratic fit (fast, UI)
//   - Psat(T): piece-wise quadratic fit (fast, UI)
//

console.warn(">>> USING PIECEWISE REGION4 <<<");

import { EPS } from "../constants.js";

/* ============================================================
   IF97 Region-4 coefficients (official IAPWS)
   Used ONLY inside Tsat_IF97(P)
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
   Tsat_IF97(P) — authoritative saturation temperature
   P in MPa → T in K
   ============================================================ */

export function Tsat_IF97(P) {
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

    const Psat_mid = Math.pow((2 * C) / (-B + Math.sqrt(D)), 4);

    if (Math.abs(Psat_mid - P) < 1e-7) return Tmid;

    Psat_mid > P ? (Thigh = Tmid) : (Tlow = Tmid);
  }

  return 0.5 * (Tlow + Thigh);
}

/* ============================================================
   Tsat(P) — piece-wise quadratic fit
   P in MPa → T in K
   ============================================================ */

const TsatPieces = [
  { Pmin: 0.000612, Pmax: 0.00192,  a: -5523041.23168, b: 26858.95814, c: 258.79094 },
  { Pmin: 0.00192,  Pmax: 0.006231, a: -573495.57216,  b: 9313.85724,  c: 274.23153 },
  { Pmin: 0.006231, Pmax: 0.017213, a: -74446.55795,  b: 3566.48701,  c: 290.66763 },
  { Pmin: 0.017213, Pmax: 0.041682, a: -12773.94256,  b: 1569.68209,  c: 306.76582 },
  { Pmin: 0.041682, Pmax: 0.090535, a: -2756.71505,   b: 773.87603,   c: 322.53279 },
  { Pmin: 0.090535, Pmax: 0.17964,  a: -719.43479,    b: 418.82759,   c: 337.97835 },
  { Pmin: 0.17964,  Pmax: 0.33045,  a: -219.65162,    b: 244.65929,   c: 353.13768 },
  { Pmin: 0.33045,  Pmax: 0.57026,  a: -76.63798,     b: 152.42795,   c: 367.99884 },
  { Pmin: 0.57026,  Pmax: 0.9322,   a: -29.90978,     b: 100.19602,   c: 382.58877 },
  { Pmin: 0.9322,   Pmax: 1.4551,   a: -12.82674,     b: 68.86951,    c: 396.94624 },
  { Pmin: 1.4551,   Pmax: 2.1831,   a: -5.96693,      b: 49.18143,    c: 411.06999 },
  { Pmin: 2.1831,   Pmax: 3.1655,   a: -2.97684,      b: 36.28023,    c: 424.98403 },
  { Pmin: 3.1655,   Pmax: 4.4569,   a: -1.57427,      b: 27.48678,    c: 438.76539 },
  { Pmin: 4.4569,   Pmax: 6.1172,   a: -0.87981,      b: 21.34922,    c: 452.32518 },
  { Pmin: 6.1172,   Pmax: 8.2132,   a: -0.51422,      b: 16.91093,    c: 465.79457 },
  { Pmin: 8.2132,   Pmax: 10.821,   a: -0.31258,      b: 13.61908,    c: 479.22960 },
  { Pmin: 10.821,   Pmax: 14.033,   a: -0.19848,      b: 11.15961,    c: 492.48242 },
  { Pmin: 14.033,   Pmax: 17.969,   a: -0.13154,      b: 9.29074,     c: 505.52590 },
  { Pmin: 17.969,   Pmax: 22.064,   a: -0.09982,      b: 8.17193,     c: 515.38910 }
];

export function Tsat(P) {
  if (P < P_TRIPLE || P > P_CRIT) return NaN;

  for (const seg of TsatPieces) {
    if (P >= seg.Pmin && P <= seg.Pmax) {
      return seg.a * P * P + seg.b * P + seg.c;
    }
  }

  return NaN;
}

/* ============================================================
   Psat(T) — piece-wise quadratic fit
   T in K → P in MPa
   ============================================================ */

const PsatPieces = [
  { Tmin: 273.16, Tmax: 290.0, a: 0.00000221167, b: -0.00116784925, c: 0.15459522618 },
  { Tmin: 290.0,  Tmax: 310.0, a: 0.00000538500, b: -0.00301545000, c: 0.42352200000 },
  { Tmin: 310.0,  Tmax: 330.0, a: 0.00001176000, b: -0.00697730000, c: 1.03905800000 },
  { Tmin: 330.0,  Tmax: 350.0, a: 0.00002259500, b: -0.01414115000, c: 2.22319700000 },
  { Tmin: 350.0,  Tmax: 370.0, a: 0.00003914500, b: -0.02574175000, c: 4.25603200000 },
  { Tmin: 370.0,  Tmax: 390.0, a: 0.00006237500, b: -0.04294975000, c: 7.44280500000 },
  { Tmin: 390.0,  Tmax: 410.0, a: 0.00009275000, b: -0.06665950000, c: 12.06957000000 },
  { Tmin: 410.0,  Tmax: 430.0, a: 0.00013055000, b: -0.09767150000, c: 18.43031000000 },
  { Tmin: 430.0,  Tmax: 450.0, a: 0.00017560000, b: -0.13643100000, c: 26.76715000000 },
  { Tmin: 450.0,  Tmax: 470.0, a: 0.00022750000, b: -0.18315500000, c: 37.28320000000 },
  { Tmin: 470.0,  Tmax: 490.0, a: 0.00028600000, b: -0.23816000000, c: 50.21290000000 },
  { Tmin: 490.0,  Tmax: 510.0, a: 0.00035100000, b: -0.30188000000, c: 65.82920000000 },
  { Tmin: 510.0,  Tmax: 530.0, a: 0.00042200000, b: -0.37431000000, c: 84.30140000000 },
  { Tmin: 530.0,  Tmax: 550.0, a: 0.00050150000, b: -0.45860500000, c: 106.64620000000 },
  { Tmin: 550.0,  Tmax: 570.0, a: 0.00059000000, b: -0.55600000000, c: 133.44220000000 },
  { Tmin: 570.0,  Tmax: 590.0, a: 0.00069100000, b: -0.67117000000, c: 166.27420000000 },
  { Tmin: 590.0,  Tmax: 610.0, a: 0.00082000000, b: -0.82340000000, c: 211.18500000000 },
  { Tmin: 610.0,  Tmax: 630.0, a: 0.00100000000, b: -1.04320000000, c: 278.28499999999 },
  { Tmin: 630.0,  Tmax: 647.1, a: 0.00139065975, b: -1.53653787991, c: 434.03501037804 }
];

export function Psat(T) {
  if (T < T_TRIPLE || T > T_CRIT) return NaN;

  for (const seg of PsatPieces) {
    if (T >= seg.Tmin && T < seg.Tmax) {
      return seg.a * T * T + seg.b * T + seg.c;
    }
  }

  return NaN;
}
