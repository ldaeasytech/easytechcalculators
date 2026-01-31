// solver.js — Fully IF97-compliant solver
// Region 1–3: single-phase
// Region 4: saturation / two-phase
// Region 2: async tabulated superheated steam

/* ============================================================
   Imports
   ============================================================ */

import {
  Psat,
  Tsat,
  rho_f_sat,
  v_f_sat,
  h_f_sat,
  s_f_sat,
  cp_f_sat,
  cv_f_sat,
  rho_g_sat,
  v_g_sat,
  h_g_sat,
  s_g_sat,
  cp_g_sat,
  cv_g_sat
} from "./if97/region4.js";

import { regionSelector } from "./if97/regionSelector.js";
import { region5 } from "./if97/region5.js";
import { region1 } from "./if97/region1.js";
import region2 from "./if97/region2.js"; // DEFAULT + ASYNC
import { region3 } from "./if97/region3.js";

import { conductivity } from "./if97/conductivity.js";
import { viscosity } from "./if97/viscosity.js";

/* ============================================================
   Constants
   ============================================================ */

const SAT_EPS = 1e-6;
const X_EPS = 1e-10;

/* ============================================================
   Main solver (ASYNC)
   ============================================================ */

export async function solve(inputs) {
  let { mode } = inputs;
  if (mode === "Ps") mode = "Ts";

  /* ======================= T–P ======================= */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
    const Ps = Psat(T);

    if (Math.abs(P - Ps) < SAT_EPS) {
      return withPhase("saturated_vapor", satVaporState(T), T, Ps);
    }

    return await singlePhaseIF97(T, P);
  }

  /* ======================= P–h ======================= */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const T = await solveTfromH(P, h);
    const Ps = Psat(T);

    if (Math.abs(P - Ps) < SAT_EPS) {
      const hf = h_f_sat(T);
      const hg = h_g_sat(T);
      const x = clamp01((h - hf) / (hg - hf));
      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, P);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, P);
      return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
    }

    return await singlePhaseIF97(T, P);
  }

  /* ======================= T–s ======================= */
  if (mode === "Ts") {
    const T = inputs.temperature;
    const s = inputs.entropy;
    const Ps = Psat(T);

    if (s >= s_f_sat(T) && s <= s_g_sat(T)) {
      const x = clamp01((s - s_f_sat(T)) / (s_g_sat(T) - s_f_sat(T)));
      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, Ps);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, Ps);
      return mixStates(satLiquidState(T), satVaporState(T), x, T, Ps);
    }

    const P = await solvePfromS(T, s);
    return await singlePhaseIF97(T, P);
  }

  /* ======================= T–x ======================= */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = Psat(T);

    if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  /* ======================= P–x ======================= */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    const T = Tsat(P);

    if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   IF97 single-phase wrapper (ASYNC)
   ============================================================ */

async function singlePhaseIF97(T, P) {
  const rgn = regionSelector(T, P);

  let props;
  if (rgn === 1) props = region1(T, P);
  else if (rgn === 2) props = await region2(T, P); // ASYNC
  else if (rgn === 3) props = region3(T, P);
  else throw new Error(`Invalid IF97 region: ${rgn}`);

  const out = {
    phase: "single_phase",
    phaseLabel: `region_${rgn}`,
    temperature: T,
    pressure: P,
    density: props.rho,
    specificVolume: props.v,
    enthalpy: props.h,
    entropy: props.s,
    cp: props.cp,
    cv: props.cv
  };

  const rho_cgs = props.rho * 1e-3;
  out.thermalConductivity = conductivity(T, rho_cgs);
  out.viscosity = viscosity(T, rho_cgs);

  return out;
}

/* ============================================================
   Saturation helpers
   ============================================================ */

function satLiquidState(T) {
  return {
    density: rho_f_sat(T),
    specificVolume: v_f_sat(T),
    enthalpy: h_f_sat(T),
    entropy: s_f_sat(T),
    cp: cp_f_sat(T),
    cv: cv_f_sat(T)
  };
}

function satVaporState(T) {
  return {
    density: rho_g_sat(T),
    specificVolume: v_g_sat(T),
    enthalpy: h_g_sat(T),
    entropy: s_g_sat(T),
    cp: cp_g_sat(T),
    cv: cv_g_sat(T)
  };
}

/* ============================================================
   Two-phase mixer
   ============================================================ */

function mixStates(L, V, x, T, P) {
  return {
    phase: "two_phase",
    phaseLabel: "two_phase",
    quality: x,
    temperature: T,
    pressure: P,
    density: NaN,
    specificVolume: NaN,
    enthalpy: (1 - x) * L.enthalpy + x * V.enthalpy,
    entropy: (1 - x) * L.entropy + x * V.entropy,
    cp: NaN,
    cv: NaN,
    thermalConductivity: NaN,
    viscosity: NaN
  };
}

/* ============================================================
   Root solvers (ASYNC, robust)
   ============================================================ */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

async function solveTfromH(P, h) {
  let lo = 273.15, hi = 2273.15;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    const hm = (await singlePhaseIF97(mid, P)).enthalpy;
    if (hm > h) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

async function solvePfromS(T, s) {
  let lo = 0.000611, hi = 100.0;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    const sm = (await singlePhaseIF97(T, mid)).entropy;
    if (sm > s) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

/* ============================================================
   Phase label helper
   ============================================================ */

function withPhase(label, state, T, P) {
  return {
    phase: label,
    phaseLabel: label,
    temperature: T,
    pressure: P,
    ...state
  };
}
