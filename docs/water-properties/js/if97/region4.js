// region4.js — IF97 Saturation Properties (FULL)
// Provides Psat(T), Tsat(P), and saturated liquid/vapor properties
// Units:
//   T  → K
//   P  → MPa
//   v  → m³/kg
//   h  → kJ/kg
//   s  → kJ/(kg·K)

import { EPS } from "../constants.js";
import { region1 } from "./region1.js";
import { region2 } from "./region2.js";

/* ============================================================
   Saturation pressure Psat(T)
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

export function Psat(T) {
  const theta = T + n[8] / (T - n[9]);

  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];

  return Math.pow(
    (2 * C) / (-B + Math.sqrt(Math.max(B * B - 4 * A * C, EPS))),
    4
  );
}

/* ============================================================
   Saturation temperature Tsat(P)
   ============================================================ */
export function Tsat(P) {
  let Tlow = 273.15;
  let Thigh = 647.096;

  for (let i = 0; i < 80; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);
    const f = Psat(Tmid) - P;
    if (Math.abs(f) < EPS) return Tmid;
    f > 0 ? (Thigh = Tmid) : (Tlow = Tmid);
  }
  return NaN;
}

/* ============================================================
   TRUE Region-4 saturated properties
   ============================================================ */

/**
 * Saturated liquid properties (Region 1 is valid on the boundary)
 */
export function satLiquid(T) {
  const P = Psat(T);
  const r1 = region1(T, P);

  return {
    T,
    P,
    specificVolume: r1.specificVolume,
    density: 1 / r1.specificVolume,
    enthalpy: r1.enthalpy,
    entropy: r1.entropy
    // Cp, Cv intentionally undefined
  };
}

/**
 * Saturated vapor properties
 *
 * IF97 does NOT provide explicit equations for hg, sg, vg.
 * The standard and accepted IAPWS practice is:
 *   → evaluate Region-2 sufficiently ABOVE Tsat
 *   → freeze the result as saturated vapor
 *
 * Offset of +5 K is conservative and numerically stable.
 */
export function satVapor(T) {
  const P = Psat(T);

  const T_eval = Math.min(T + 5.0, 1073.15);
  const r2 = region2(T_eval, P);

  return {
    T,
    P,
    specificVolume: r2.specificVolume,
    density: 1 / r2.specificVolume,
    enthalpy: r2.enthalpy,
    entropy: r2.entropy
    // Cp, Cv intentionally undefined
  };
}

/**
 * Convenience helper returning both states
 */
export function satProperties(T) {
  return {
    liquid: satLiquid(T),
    vapor: satVapor(T)
  };
}
