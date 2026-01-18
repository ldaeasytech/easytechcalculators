// solver.js
// Robust thermodynamic state solver built on IF97 core
// INTERNAL UNITS:
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   s  → kJ/(kg·K)

import { computeIF97 } from "./if97/if97.js";
import { Psat, Tsat } from "./if97/region4.js";
import { T_MIN, T_MAX } from "./if97/constants.js";

const MAX_ITER = 60;
const TOL = 1e-8;

/* ============================================================
   Direct solvers
   ============================================================ */

/**
 * Solve from (T, P)
 */
export function solveTP(T, P) {
  return computeIF97(T, P);
}

/**
 * Solve from (T, x) — saturated mixture only
 */
export function solveTx(T, x) {
  if (x < 0 || x > 1) {
    throw new Error("Quality x must be between 0 and 1");
  }

  const P = Psat(T);

  // Force single-phase evaluation on each side of saturation
  const satL = computeIF97(T, P * 1.000001);
  const satV = computeIF97(T, P * 0.999999);

  const v =
    satL.specificVolume +
    x * (satV.specificVolume - satL.specificVolume);

  return {
    region: 4,
    phase: "two-phase",
    T,
    P,
    quality: x,
    specificVolume: v,
    density: 1 / v,
    enthalpy:
      satL.enthalpy + x * (satV.enthalpy - satL.enthalpy),
    entropy:
      satL.entropy + x * (satV.entropy - satL.entropy),
    cp: NaN,
    cv: NaN
  };
}

/* ============================================================
   Inverse solvers (bracketed Newton)
   ============================================================ */

/**
 * Solve from (P, h)
 */
export function solvePH(P, hTarget) {
  const Ts = Tsat(P);

  // Bracket temperature safely
  let Tlow = T_MIN;
  let Thigh = T_MAX;

  // Improve initial bracket using saturation
  if (isFinite(Ts)) {
    const hL = computeIF97(Ts * 0.999, P).enthalpy;
    const hV = computeIF97(Ts * 1.001, P).enthalpy;

    if (hTarget > hL && hTarget < hV) {
      // Two-phase
      const x = (hTarget - hL) / (hV - hL);
      return solveTx(Ts, x);
    }

    if (hTarget <= hL) Thigh = Ts;
    if (hTarget >= hV) Tlow = Ts;
  }

  let T = 0.5 * (Tlow + Thigh);

  for (let i = 0; i < MAX_ITER; i++) {
    const state = computeIF97(T, P);
    const f = state.enthalpy - hTarget;

    if (Math.abs(f) < TOL) return state;

    // Newton step
    const dHdT = state.cp;
    if (!isFinite(dHdT) || dHdT <= 0) break;

    let Tnew = T - f / dHdT;

    // Enforce bracketing
    if (Tnew <= Tlow || Tnew >= Thigh) {
      Tnew = 0.5 * (Tlow + Thigh);
    }

    if (f > 0) Thigh = T;
    else Tlow = T;

    T = Tnew;
  }

  throw new Error("solvePH did not converge");
}

/**
 * Solve from (P, s)
 */
export function solvePS(P, sTarget) {
  const Ts = Tsat(P);

  let Tlow = T_MIN;
  let Thigh = T_MAX;

  if (isFinite(Ts)) {
    const sL = computeIF97(Ts * 0.999, P).entropy;
    const sV = computeIF97(Ts * 1.001, P).entropy;

    if (sTarget > sL && sTarget < sV) {
      const x = (sTarget - sL) / (sV - sL);
      return solveTx(Ts, x);
    }

    if (sTarget <= sL) Thigh = Ts;
    if (sTarget >= sV) Tlow = Ts;
  }

  let T = 0.5 * (Tlow + Thigh);

  for (let i = 0; i < MAX_ITER; i++) {
    const state = computeIF97(T, P);
    const f = state.entropy - sTarget;

    if (Math.abs(f) < TOL) return state;

    const dSdT = state.cp / T;
    if (!isFinite(dSdT) || dSdT <= 0) break;

    let Tnew = T - f / dSdT;

    if (Tnew <= Tlow || Tnew >= Thigh) {
      Tnew = 0.5 * (Tlow + Thigh);
    }

    if (f > 0) Thigh = T;
    else Tlow = T;

    T = Tnew;
  }

  throw new Error("solvePS did not converge");
}

/* ============================================================
   Generic dispatcher
   ============================================================ */

export function solve(inputs) {
  const keys = Object.keys(inputs).sort().join(",");

  switch (keys) {
    case "P,T":
      return solveTP(inputs.T, inputs.P);

    case "P,h":
      return solvePH(inputs.P, inputs.h);

    case "P,s":
      return solvePS(inputs.P, inputs.s);

    case "T,x":
      return solveTx(inputs.T, inputs.x);

    default:
      throw new Error(
        "Unsupported property pair. Allowed: (T,P), (P,h), (P,s), (T,x)"
      );
  }
}
