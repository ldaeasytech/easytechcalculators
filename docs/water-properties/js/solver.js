// solver.js
// Central thermodynamic state solver (IF97)
// INTERNAL UNITS:
//   temperature → K
//   pressure    → MPa
//   enthalpy    → kJ/kg
//   entropy     → kJ/(kg·K)

import {
  T_MIN,
  T_MAX,
  T_R1_MAX,
  T_R5_MIN,
  P_R5_MAX,
  EPS
} from "./constants.js";

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region3 } from "./if97/region3.js";
import { region5 } from "./if97/region5.js";
import { Psat, Tsat } from "./if97/region4.js";

const MAX_ITER = 80;

/* ============================================================
   Normalize inputs
   ============================================================ */
function normalizeInputs(raw) {
  return {
    temperature: raw.temperature ?? raw.T,
    pressure: raw.pressure ?? raw.P,
    enthalpy: raw.enthalpy ?? raw.h,
    entropy: raw.entropy ?? raw.s,
    quality: raw.quality ?? raw.x
  };
}

/* ============================================================
   Region selection for (T, P)
   ============================================================ */
function solveTP(T, P) {
  const Ps = Psat(T);

  // Region 5: high temperature vapor
  if (T >= T_R5_MIN && P <= P_R5_MAX) {
    return {
      T,
      P,
      phase: "superheated_vapor",
      ...region5(T, P)
    };
  }

  // Saturation line (default → vapor side)
  if (Math.abs(P - Ps) / Ps < 1e-7) {
    return {
      T,
      P,
      phase: "saturated_vapor",
      ...region2(T, P)
    };
  }

  // Compressed / subcooled liquid
  if (T <= T_R1_MAX && P > Ps) {
    return {
      T,
      P,
      phase: "compressed_liquid",
      ...region1(T, P)
    };
  }

  // Superheated vapor (Region 2)
  if (T <= T_R1_MAX && P < Ps) {
    return {
      T,
      P,
      phase: "superheated_vapor",
      ...region2(T, P)
    };
  }

  // Dense fluid / near critical (Region 3)
  return {
    T,
    P,
    phase: "dense_fluid",
    ...region3(T, P)
  };
}

/* ============================================================
   Saturated mixture (T, x)
   ============================================================ */
function solveTx(T, x) {
  if (x < 0 || x > 1) {
    throw new Error("Quality must be between 0 and 1");
  }

  const P = Psat(T);

  const satL = region1(T, P);
  const satV = region2(T, P);

  const mix = (a, b) => a + x * (b - a);

  return {
    region: 4,
    phase: "two_phase",
    T,
    P,
    quality: x,
    density: 1 / mix(satL.specificVolume, satV.specificVolume),
    specificVolume: mix(
      satL.specificVolume,
      satV.specificVolume
    ),
    enthalpy: mix(satL.enthalpy, satV.enthalpy),
    entropy: mix(satL.entropy, satV.entropy),
    cp: NaN,
    cv: NaN,
    viscosity: NaN,
    conductivity: NaN
  };
}

/* ============================================================
   Inverse solvers
   ============================================================ */
function solvePH(P, hTarget) {
  const Ts = Tsat(P);

  let Tlow = T_MIN;
  let Thigh = T_MAX;

  if (Number.isFinite(Ts)) {
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
    const state = solveTP(T, P);
    const f = state.enthalpy - hTarget;

    if (Math.abs(f) < EPS) return state;

    if (!Number.isFinite(state.cp) || state.cp <= 0) {
      break;
    }

    const Tnew = T - f / state.cp;
    T = Math.min(Math.max(Tnew, Tlow), Thigh);

    f > 0 ? (Thigh = T) : (Tlow = T);
  }

  throw new Error("solvePH did not converge");
}

function solvePS(P, sTarget) {
  const Ts = Tsat(P);

  let Tlow = T_MIN;
  let Thigh = T_MAX;

  if (Number.isFinite(Ts)) {
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
    const state = solveTP(T, P);
    const f = state.entropy - sTarget;

    if (Math.abs(f) < EPS) return state;

    const dSdT = state.cp / T;
    if (!Number.isFinite(dSdT) || dSdT <= 0) break;

    const Tnew = T - f / dSdT;
    T = Math.min(Math.max(Tnew, Tlow), Thigh);

    f > 0 ? (Thigh = T) : (Tlow = T);
  }

  throw new Error("solvePS did not converge");
}

/* ============================================================
   Public dispatcher
   ============================================================ */
export function solve(rawInputs) {
  const {
    temperature: T,
    pressure: P,
    enthalpy: h,
    entropy: s,
    quality: x
  } = normalizeInputs(rawInputs);

  if (Number.isFinite(T) && Number.isFinite(P)) return solveTP(T, P);
  if (Number.isFinite(P) && Number.isFinite(h)) return solvePH(P, h);
  if (Number.isFinite(P) && Number.isFinite(s)) return solvePS(P, s);
  if (Number.isFinite(T) && Number.isFinite(x)) return solveTx(T, x);

  throw new Error(
    "Unsupported property pair. Allowed: (T,P), (P,h), (P,s), (T,x)"
  );
}
