// solver.js
// Central thermodynamic state solver (IF97, industry-correct)
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

import {
  Psat,
  Tsat,
  satLiquid,
  satVapor
} from "./if97/region4.js";

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
   T–P solver
   ============================================================ */
function solveTP(T, P) {
  const Ps = Psat(T);

  // High-temperature vapor (Region 5)
  if (T >= T_R5_MIN && P <= P_R5_MAX) {
    return { T, P, phase: "superheated_vapor", ...region5(T, P) };
  }

  // --- SATURATION GUARD ---
  if (Math.abs(P - Ps) / Ps < 1e-7) {
    return {
      region: 4,
      T,
      P,
      phase: "two_phase",
      satL: satLiquid(T),
      satV: satVapor(T)
    };
  }

  // Compressed / subcooled liquid
  if (T <= T_R1_MAX && P > Ps) {
    return { T, P, phase: "compressed_liquid", ...region1(T, P) };
  }

  // Superheated vapor
  if (T <= T_R1_MAX && P < Ps) {
    return { T, P, phase: "superheated_vapor", ...region2(T, P) };
  }

  // Dense fluid / near critical
  return { T, P, phase: "dense_fluid", ...region3(T, P) };
}

/* ============================================================
   T–x solver (TRUE REGION-4)
   ============================================================ */
function solveTx(T, x) {
  if (x < 0 || x > 1) {
    throw new Error("Quality must be between 0 and 1");
  }

  const satL = satLiquid(T);
  const satV = satVapor(T);

  const EPS_X = 1e-9;

  // Saturated liquid
  if (x <= EPS_X) {
    return {
      ...satL,
      phase: "saturated_liquid",
      quality: 0
    };
  }

  // Saturated vapor
  if (x >= 1 - EPS_X) {
    return {
      ...satV,
      phase: "saturated_vapor",
      quality: 1
    };
  }

  // Two-phase mixture (Cp/Cv undefined → omitted)
  const mix = (a, b) => a + x * (b - a);
  const v = mix(satL.specificVolume, satV.specificVolume);

  return {
    region: 4,
    phase: "two_phase",
    T,
    P: satL.P,
    quality: x,
    specificVolume: v,
    density: 1 / v,
    enthalpy: mix(satL.enthalpy, satV.enthalpy),
    entropy: mix(satL.entropy, satV.entropy)
  };
}

/* ============================================================
   P–h solver
   ============================================================ */
function solvePH(P, hTarget) {
  const Ts = Tsat(P);

  if (Number.isFinite(Ts)) {
    const satL = satLiquid(Ts);
    const satV = satVapor(Ts);

    if (hTarget > satL.enthalpy && hTarget < satV.enthalpy) {
      const x = (hTarget - satL.enthalpy) /
                (satV.enthalpy - satL.enthalpy);
      return solveTx(Ts, x);
    }
  }

  let Tlow = T_MIN;
  let Thigh = T_MAX;
  let T = 0.5 * (Tlow + Thigh);

  for (let i = 0; i < MAX_ITER; i++) {
    const state = solveTP(T, P);
    const f = state.enthalpy - hTarget;
    if (Math.abs(f) < EPS) return state;

    if (!state.cp || state.cp <= 0) break;
    T -= f / state.cp;
    T = Math.min(Math.max(T, Tlow), Thigh);
  }

  throw new Error("solvePH did not converge");
}

/* ============================================================
   P–s solver
   ============================================================ */
function solvePS(P, sTarget) {
  const Ts = Tsat(P);

  if (Number.isFinite(Ts)) {
    const satL = satLiquid(Ts);
    const satV = satVapor(Ts);

    if (sTarget > satL.entropy && sTarget < satV.entropy) {
      const x = (sTarget - satL.entropy) /
                (satV.entropy - satL.entropy);
      return solveTx(Ts, x);
    }
  }

  let Tlow = T_MIN;
  let Thigh = T_MAX;
  let T = 0.5 * (Tlow + Thigh);

  for (let i = 0; i < MAX_ITER; i++) {
    const state = solveTP(T, P);
    const f = state.entropy - sTarget;
    if (Math.abs(f) < EPS) return state;

    if (!state.cp || state.cp <= 0) break;
    T -= f / (state.cp / T);
    T = Math.min(Math.max(T, Tlow), Thigh);
  }

  throw new Error("solvePS did not converge");
}

/* ============================================================
   Public dispatcher
   ============================================================ */
export function solve(rawInputs) {
  const { temperature: T, pressure: P, enthalpy: h, entropy: s, quality: x } =
    normalizeInputs(rawInputs);

  if (Number.isFinite(T) && Number.isFinite(P)) return solveTP(T, P);
  if (Number.isFinite(P) && Number.isFinite(h)) return solvePH(P, h);
  if (Number.isFinite(P) && Number.isFinite(s)) return solvePS(P, s);
  if (Number.isFinite(T) && Number.isFinite(x)) return solveTx(T, x);

  throw new Error(
    "Unsupported property pair. Allowed: (T,P), (P,h), (P,s), (T,x)"
  );
}
