// solver.js
// Central thermodynamic solver (IF97-compliant)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region3 } from "./if97/region3.js";

// ✅ CORRECT imports from region4.js
import { Psat, Tsat } from "./if97/region4.js";

import { region5 } from "./if97/region5.js";
import { computeQuality } from "./quality.js";
import { T_R1_MAX, T_R5_MIN, P_R5_MAX } from "./constants.js";

// ✅ Alias to names used throughout solver
const saturationPressure = Psat;
const saturationTemperature = Tsat;


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
   T–P (most common)
   ============================================================ */

function solveTP(T, P) {
  const Tsat = saturationTemperature(P);

  if (T < Tsat - 1e-6) {
    return region1(T, P);
  }

  if (Math.abs(T - Tsat) <= 1e-6) {
    const satL = region1(T, P);
    const satV = region2(T, P);
    return {
      region: 4,
      phase: "two_phase",
      T,
      P,
      quality: null,
      satL,
      satV
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
   T–x (QUALITY) — FIXED
   ============================================================ */

function solveTx({ temperature, quality }) {
  if (quality < 0 || quality > 1) {
    throw new Error("Quality x must be between 0 and 1.");
  }

  const T = temperature;
  const P = saturationPressure(T);

  const satL = region1(T, P);
  const satV = region2(T, P);

  // Endpoints MUST be returned directly
  if (quality === 0) {
    return {
      ...satL,
      phase: "saturated_liquid",
      quality: 0
    };
  }

  if (quality === 1) {
    return {
      ...satV,
      phase: "saturated_vapor",
      quality: 1
    };
  }

  // Two-phase mixture
  const mix = {
    region: 4,
    phase: "two_phase",
    T,
    P,
    quality,

    specificVolume:
      satL.specificVolume +
      quality * (satV.specificVolume - satL.specificVolume),

    enthalpy:
      satL.enthalpy +
      quality * (satV.enthalpy - satL.enthalpy),

    entropy:
      satL.entropy +
      quality * (satV.entropy - satL.entropy)
  };

  mix.density = 1 / mix.specificVolume;

  return mix;
}

/* ============================================================
   P–h
   ============================================================ */

function solvePh({ pressure, enthalpy }) {
  const P = pressure;
  const Tsat = saturationTemperature(P);

  const satL = region1(Tsat, P);
  const satV = region2(Tsat, P);

  if (enthalpy < satL.enthalpy) {
    return region1(findT(P, enthalpy, region1), P);
  }

  if (enthalpy > satV.enthalpy) {
    return region2(findT(P, enthalpy, region2), P);
  }

  const x = computeQuality(satL, satV, { enthalpy });

  return solveTx({ temperature: Tsat, quality: x });
}

/* ============================================================
   P–s
   ============================================================ */

function solvePs({ pressure, entropy }) {
  const P = pressure;
  const Tsat = saturationTemperature(P);

  const satL = region1(Tsat, P);
  const satV = region2(Tsat, P);

  if (entropy < satL.entropy) {
    return region1(findT(P, entropy, region1, "entropy"), P);
  }

  if (entropy > satV.entropy) {
    return region2(findT(P, entropy, region2, "entropy"), P);
  }

  const x = computeQuality(satL, satV, { entropy });

  return solveTx({ temperature: Tsat, quality: x });
}

/* ============================================================
   Root finder (generic)
   ============================================================ */

function findT(P, target, regionFn, key = "enthalpy") {
  let Tlow = 250;
  let Thigh = 2000;

  for (let i = 0; i < 50; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);
    const state = regionFn(Tmid, P);
    if (state[key] > target) Thigh = Tmid;
    else Tlow = Tmid;
  }

  return 0.5 * (Tlow + Thigh);
}
