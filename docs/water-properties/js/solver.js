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
  k_f_sat,
  mu_f_sat,

  rho_g_sat,
  v_g_sat,
  h_g_sat,
  s_g_sat,
  cp_g_sat,
  cv_g_sat,
  k_g_sat,
  mu_g_sat
} from "./if97/region4.js";

import { regionSelector } from "./if97/regionSelector.js";
import { region1 } from "./if97/region1.js";
import region2 from "./if97/region2.js";
import { region3 } from "./if97/region3.js";

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
      return satVaporState(T, Ps);
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

      if (x <= X_EPS) return satLiquidState(T, P);
      if (1 - x <= X_EPS) return satVaporState(T, P);
      return mixStates(T, P, x);
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

      if (x <= X_EPS) return satLiquidState(T, Ps);
      if (1 - x <= X_EPS) return satVaporState(T, Ps);
      return mixStates(T, Ps, x);
    }

    const P = await solvePfromS(T, s);
    return await singlePhaseIF97(T, P);
  }

  /* ======================= T–x ======================= */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = Psat(T);

    if (x <= X_EPS) return satLiquidState(T, P);
    if (1 - x <= X_EPS) return satVaporState(T, P);
    return mixStates(T, P, x);
  }

  /* ======================= P–x ======================= */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    const T = Tsat(P);

    if (x <= X_EPS) return satLiquidState(T, P);
    if (1 - x <= X_EPS) return satVaporState(T, P);
    return mixStates(T, P, x);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   IF97 single-phase wrapper
   ============================================================ */

async function singlePhaseIF97(T, P) {
  const rgn = regionSelector(T, P);

  let props;
  if (rgn === 1) props = await region1(T, P);
  else if (rgn === 2) props = await region2(T, P);
  else if (rgn === 3) props = region3(T, P);
  else throw new Error(`Invalid IF97 region: ${rgn}`);

  return {
    phase: "single_phase",
    phaseLabel: `region_${rgn}`,
    temperature: T,
    pressure: P,

    rho: props.rho,
    v: props.v,
    h: props.h,
    s: props.s,
    cp: props.cp,
    cv: props.cv,
    k: props.k,
    mu: props.mu
  };
}

/* ============================================================
   Saturated states (CANONICAL KEYS)
   ============================================================ */

function satLiquidState(T, P) {
  return {
    phase: "saturated_liquid",
    phaseLabel: "saturated_liquid",
    temperature: T,
    pressure: P,

    rho: rho_f_sat(T),
    v: v_f_sat(T),
    h: h_f_sat(T),
    s: s_f_sat(T),
    cp: cp_f_sat(T),
    cv: cv_f_sat(T),
    k: k_f_sat(T),
    mu: mu_f_sat(T)
  };
}

function satVaporState(T, P) {
  return {
    phase: "saturated_vapor",
    phaseLabel: "saturated_vapor",
    temperature: T,
    pressure: P,

    rho: rho_g_sat(T),
    v: v_g_sat(T),
    h: h_g_sat(T),
    s: s_g_sat(T),
    cp: cp_g_sat(T),
    cv: cv_g_sat(T),
    k: k_g_sat(T),
    mu: mu_g_sat(T)
  };
}

/* ============================================================
   Two-phase mixture (intentionally NaN transport)
   ============================================================ */

function mixStates(T, P, x) {
  return {
    phase: "two_phase",
    phaseLabel: "two_phase",
    quality: x,
    temperature: T,
    pressure: P,

    rho: NaN,
    v: NaN,
    h: (1 - x) * h_f_sat(T) + x * h_g_sat(T),
    s: (1 - x) * s_f_sat(T) + x * s_g_sat(T),
    cp: NaN,
    cv: NaN,
    k: NaN,
    mu: NaN
  };
}

/* ============================================================
   Root solvers
   ============================================================ */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

async function solveTfromH(P, h) {
  let lo = 273.15, hi = 2273.15;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    const hm = (await singlePhaseIF97(mid, P)).h;
    hm > h ? hi = mid : lo = mid;
  }
  return 0.5 * (lo + hi);
}

async function solvePfromS(T, s) {
  let lo = 0.000611, hi = 100.0;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    const sm = (await singlePhaseIF97(T, mid)).s;
    sm > s ? hi = mid : lo = mid;
  }
  return 0.5 * (lo + hi);
}
