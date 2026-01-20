// solver.js
// Central thermodynamic solver (IF97-compliant) 

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region3 } from "./if97/region3.js";
import { Psat, Tsat } from "./if97/region4.js";
import { region5 } from "./if97/region5.js";

import { computeQuality } from "./quality.js";
import { T_R1_MAX, T_R5_MIN, P_R5_MAX } from "./constants.js";

// Aliases (keep naming coherent)
const saturationPressure = Psat;
const saturationTemperature = Tsat;

// Small offset to avoid IF97 singularities at saturation
const SAT_EPS_P = 1e-6; // MPa
const SAT_EPS_T = 1e-6; // K

/* ============================================================
   Public solver entry
   ============================================================ */

export function solve(inputs) {
  if ("quality" in inputs && "temperature" in inputs) {
    return solveTx(inputs);
  }

  if ("temperature" in inputs && "pressure" in inputs) {
    return solveTP(inputs.temperature, inputs.pressure);
  }

  if ("pressure" in inputs && "enthalpy" in inputs) {
    return solvePh(inputs);
  }

  if ("pressure" in inputs && "entropy" in inputs) {
    return solvePs(inputs);
  }

  throw new Error("Unsupported input combination.");
}

/* ============================================================
   T–P
   ============================================================ */

function solveTP(T, P) {
  const Ts = saturationTemperature(P);

  if (T < Ts - SAT_EPS_T) {
    return region1(T, P);
  }

  if (Math.abs(T - Ts) <= SAT_EPS_T) {
    const sat = getSaturationStates_T(T);
    return {
      region: 4,
      phase: "two_phase",
      T,
      P,
      satL: sat.liquid,
      satV: sat.vapor
    };
  }

  if (T >= T_R5_MIN && P <= P_R5_MAX) {
    return region5(T, P);
  }

  if (T > T_R1_MAX) {
    return region2(T, P);
  }

  return region3(T, P);
}

/* ============================================================
   T–x  (TRUE REGION-4 HANDLING)
   ============================================================ */

function solveTx({ temperature, quality }) {
  const x = Number(quality);

  if (!Number.isFinite(x) || x < 0 || x > 1) {
    throw new Error("Quality x must be between 0 and 1.");
  }

  const T = temperature;
  const P = saturationPressure(T);

  const sat = getSaturationStates_T(T);

  const EPS_X = 1e-9;

  // Saturated liquid
  if (x <= EPS_X) {
    return {
      ...sat.liquid,
      phase: "saturated_liquid",
      quality: 0
    };
  }

  // Saturated vapor
  if (x >= 1 - EPS_X) {
    return {
      ...sat.vapor,
      phase: "saturated_vapor",
      quality: 1
    };
  }

  // Two-phase mixture
  const v =
    sat.liquid.specificVolume +
    x * (sat.vapor.specificVolume - sat.liquid.specificVolume);

  const h =
    sat.liquid.enthalpy +
    x * (sat.vapor.enthalpy - sat.liquid.enthalpy);

  const s =
    sat.liquid.entropy +
    x * (sat.vapor.entropy - sat.liquid.entropy);

  return {
    region: 4,
    phase: "two_phase",
    T,
    P,
    quality: x,
    specificVolume: v,
    density: 1 / v,
    enthalpy: h,
    entropy: s
  };
}

/* ============================================================
   P–h
   ============================================================ */

function solvePh({ pressure, enthalpy }) {
  const P = pressure;
  const Ts = saturationTemperature(P);

  const sat = getSaturationStates_P(P);

  if (enthalpy < sat.liquid.enthalpy) {
    return region1(findT(P, enthalpy, region1), P);
  }

  if (enthalpy > sat.vapor.enthalpy) {
    return region2(findT(P, enthalpy, region2), P);
  }

  const x = computeQuality(sat.liquid, sat.vapor, { enthalpy });
  return solveTx({ temperature: Ts, quality: x });
}

/* ============================================================
   P–s
   ============================================================ */

function solvePs({ pressure, entropy }) {
  const P = pressure;
  const Ts = saturationTemperature(P);

  const sat = getSaturationStates_P(P);

  if (entropy < sat.liquid.entropy) {
    return region1(findT(P, entropy, region1, "entropy"), P);
  }

  if (entropy > sat.vapor.entropy) {
    return region2(findT(P, entropy, region2, "entropy"), P);
  }

  const x = computeQuality(sat.liquid, sat.vapor, { entropy });
  return solveTx({ temperature: Ts, quality: x });
}

/* ============================================================
   Saturation helpers (TRUE REGION-4 STATES)
   ============================================================ */

function getSaturationStates_T(T) {
  const P = saturationPressure(T);

  return {
    liquid: region1(T - SAT_EPS_T, P),
    vapor: region2(T + SAT_EPS_T, P * (1 - SAT_EPS_P))
  };
}

function getSaturationStates_P(P) {
  const T = saturationTemperature(P);

  return {
    liquid: region1(T - SAT_EPS_T, P),
    vapor: region2(T + SAT_EPS_T, P * (1 - SAT_EPS_P))
  };
}

/* ============================================================
   Root finder
   ============================================================ */

function findT(P, target, regionFn, key = "enthalpy") {
  let Tlow = 250;
  let Thigh = 2000;

  for (let i = 0; i < 50; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);
    const state = regionFn(Tmid, P);
    state[key] > target ? (Thigh = Tmid) : (Tlow = Tmid);
  }

  return 0.5 * (Tlow + Thigh);
}
