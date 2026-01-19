// solver.js
// Robust thermodynamic state solver built on IF97 core
// INTERNAL UNITS:
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   s  → kJ/(kg·K)

import { computeIF97 } from "./if97/if97.js";
import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat, Tsat } from "./if97/region4.js";
import { T_MIN, T_MAX } from "./if97/constants.js";

const MAX_ITER = 60;
const TOL = 1e-8;

/* ============================================================
   Utility: normalize solver inputs
   ============================================================ */

function normalizeInputs(raw) {
  return {
    T: raw.T ?? raw.temperature,
    P: raw.P ?? raw.pressure,
    h: raw.h ?? raw.enthalpy,
    s: raw.s ?? raw.entropy,
    x: raw.x ?? raw.quality
  };
}

/* ============================================================
   Direct solvers
   ============================================================ */

export function solveTP(T, P) {
  return computeIF97(T, P);
}

/**
 * Solve from (T, x) — saturated mixture only
 */
export function solveTx(T, x) {
  if (!Number.isFinite(x) || x < 0 || x > 1) {
    throw new Error("Quality x must be between 0 and 1");
  }

  const P = Psat(T);

  // Saturated liquid → Region 1
  const satL = region1(T, P);

  // Saturated vapor → Region 2 (EXPLICIT, no pressure fudge)
  const satV = region2(T, P);

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
   Inverse solvers
   ============================================================ */

export function solvePH(P, hTarget) {
  const Ts = Tsat(P);

  let Tlow = T_MIN;
  let Thigh = T_MAX;

  if (isFinite(Ts)) {
    const hL = region1(Ts, P).enthalpy;
    const hV = region2(Ts, P).enthalpy;

    if (hTarget > hL && hTarget < hV) {
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

    const dHdT = state.cp;
    if (!isFinite(dHdT) || dHdT <= 0) break;

    let Tnew = T - f / dHdT;
    if (Tnew <= Tlow || Tnew >= Thigh) {
      Tnew = 0.5 * (Tlow + Thigh);
    }

    if (f > 0) Thigh = T;
    else Tlow = T;

    T = Tnew;
  }

  throw new Error("solvePH did not converge");
}

export function solvePS(P, sTarget) {
  const Ts = Tsat(P);

  let Tlow = T_MIN;
  let Thigh = T_MAX;

  if (isFinite(Ts)) {
    const sL = region1(Ts, P).entropy;
    const sV = region2(Ts, P).entropy;

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
   Generic dispatcher (ROBUST)
   ============================================================ */

export function solve(rawInputs) {
  const { T, P, h, s, x } = normalizeInputs(rawInputs);

  if (Number.isFinite(T) && Number.isFinite(P)) {
    return solveTP(T, P);
  }

  if (Number.isFinite(P) && Number.isFinite(h)) {
    return solvePH(P, h);
  }

  if (Number.isFinite(P) && Number.isFinite(s)) {
    return solvePS(P, s);
  }

  if (Number.isFinite(T) && Number.isFinite(x)) {
    return solveTx(T, x);
  }

  throw new Error(
    "Unsupported property pair. Allowed: (T,P), (P,h), (P,s), (T,x)"
  );
}
