// solver.js — Fully IF97-compliant solver
// Region 1–3: single-phase
// Region 4: saturation / two-phase

/* ============================================================
   Imports
   ============================================================ */

/*import {
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

const SINGLE_PHASE_LABEL = {
  1: "Compressed liquid",
  2: "Superheated vapor",
  3: "Compressed liquid"
};

/* ============================================================
   Mode-aware output filter
   ============================================================ */

function formatOutput(state, mode) {
  const out = { ...state };

  if (mode === "Ph" || mode === "Ps" || mode === "Px") {
    out.temperature = state.temperature;
  }

  if (mode === "Tx") {
    out.pressure = state.pressure;
  }

  return out;
}

/* ============================================================
   Main solver
   ============================================================ */

export async function solve(inputs) {
  const { mode } = inputs;

  /* ======================= T–P ======================= */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
   const { Psat } = await import("./if97/region4.js");
    const Ps = Psat(T);

    if (Math.abs(P - Ps) < SAT_EPS) {
      return formatOutput(satVaporState(T, Ps), mode);
    }

    return formatOutput(await singlePhaseIF97(T, P), mode);
  }

  /* ======================= P–h ======================= */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const rgn = regionSelector({ P, h, mode: "Ph" });

    if (rgn === 4) {
      const T = Tsat(P);
      const hf = h_f_sat(T);
      const hg = h_g_sat(T);
      const x = clamp01((h - hf) / (hg - hf));

      if (x <= X_EPS) return formatOutput(satLiquidState(T, P), mode);
      if (1 - x <= X_EPS) return formatOutput(satVaporState(T, P), mode);
      return formatOutput(mixStates(T, P, x), mode);
    }

    const T = await solveTfromH(P, h, rgn);
    return formatOutput(await singlePhaseIF97(T, P), mode);
  }

  /* ======================= P–s ======================= */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;

    const rgn = regionSelector({ P, s, mode: "Ps" });

    if (rgn === 4) {
      const T = Tsat(P);
      const sf = s_f_sat(T);
      const sg = s_g_sat(T);
      const x = clamp01((s - sf) / (sg - sf));

      if (x <= X_EPS) return formatOutput(satLiquidState(T, P), mode);
      if (1 - x <= X_EPS) return formatOutput(satVaporState(T, P), mode);
      return formatOutput(mixStates(T, P, x), mode);
    }

    const T = await solveTfromS(P, s, rgn);
    return formatOutput(await singlePhaseIF97(T, P), mode);
  }

  /* ======================= T–x ======================= */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = Psat(T);

    if (x <= X_EPS) return formatOutput(satLiquidState(T, P), mode);
    if (1 - x <= X_EPS) return formatOutput(satVaporState(T, P), mode);
    return formatOutput(mixStates(T, P, x), mode);
  }

  /* ======================= P–x ======================= */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    const T = Tsat(P);

    if (x <= X_EPS) return formatOutput(satLiquidState(T, P), mode);
    if (1 - x <= X_EPS) return formatOutput(satVaporState(T, P), mode);
    return formatOutput(mixStates(T, P, x), mode);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   IF97 single-phase wrapper
   ============================================================ */

/*async function singlePhaseIF97(T, P) {
  const rgn = regionSelector({ T, P, mode: "TP" });

  let props;
  if (rgn === 1) props = await region1(T, P);
  else if (rgn === 2) props = await region2(T, P);
  else if (rgn === 3) props = region3(T, P);
  else throw new Error(`Invalid IF97 region: ${rgn}`);

  return {
    phase: "single_phase",
    phaseLabel: SINGLE_PHASE_LABEL[rgn],
    temperature: T,
    pressure: P,
    ...props
  };
}*/


async function singlePhaseIF97(T, P) {
  const { regionSelector } = await import("./if97/regionSelector.js");
  const rgn = regionSelector({ T, P, mode: "TP" });

  let props;

  if (rgn === 1) {
    const { region1 } = await import("./if97/region1.js");
    props = await region1(T, P);
  }
  else if (rgn === 2) {
    const mod = await import("./if97/region2.js");
    props = await mod.default(T, P);
  }
  else if (rgn === 3) {
    const { region3 } = await import("./if97/region3.js");
    props = region3(T, P);
  }
  else {
    throw new Error(`Invalid IF97 region: ${rgn}`);
  }

  return {
    phase: "single_phase",
    phaseLabel: SINGLE_PHASE_LABEL[rgn],
    temperature: T,
    pressure: P,
    ...props
  };
}

/* ============================================================
   Saturated & mixture helpers
   ============================================================ */
const r4 = await import("./if97/region4.js");
function satLiquidState(T, P) {
  return {
    phase: "saturated_liquid",
    phaseLabel: "Saturated liquid",
    temperature: T,
    pressure: P,

    rho: r4.rho_f_sat(T),
    v: r4.v_f_sat(T),
    h: r4.h_f_sat(T),
    s: r4.s_f_sat(T),
    cp: r4.cp_f_sat(T),
    cv: r4.cv_f_sat(T),
    k: r4.k_f_sat(T),
    mu: r4.mu_f_sat(T)
  };
}

function satVaporState(T, P) {
  return {
    phase: "saturated_vapor",
    phaseLabel: "Saturated vapor",
    temperature: T,
    pressure: P,

    rho: r4.rho_g_sat(T),
    v: r4.v_g_sat(T),
    h: r4.h_g_sat(T),
    s: r4.s_g_sat(T),
    cp: r4.cp_g_sat(T),
    cv: r4.cv_g_sat(T),
    k: r4.k_g_sat(T),
    mu: r4.mu_g_sat(T)
  };
}

function mixStates(T, P, x) {
  // Saturated liquid properties
  const rho_f = r4.rho_f_sat(T);
  const v_f   = r4.v_f_sat(T);
  const h_f   = r4.h_f_sat(T);
  const s_f   = r4.s_f_sat(T);
  const cp_f  = r4.cp_f_sat(T);
  const cv_f  = r4.cv_f_sat(T);
  const k_f   = r4.k_f_sat(T);
  const mu_f  = r4.mu_f_sat(T);

  // Saturated vapor properties
  const rho_g = r4.rho_g_sat(T);
  const v_g   = r4.v_g_sat(T);
  const h_g   = r4.h_g_sat(T);
  const s_g   = r4.s_g_sat(T);
  const cp_g  = r4.cp_g_sat(T);
  const cv_g  = r4.cv_g_sat(T);
  const k_g   = r4.k_g_sat(T);
  const mu_g  = r4.mu_g_sat(T);

  return {
    phase: "two_phase",
    phaseLabel: "Two-phase",
    quality: x,
    temperature: T,
    pressure: P,

    // Mixture rules
    v:   (1 - x) * v_f   + x * v_g,
    rho: 1/((1 - x) * v_f   + x * v_g),
    h:   (1 - x) * h_f   + x * h_g,
    s:   (1 - x) * s_f   + x * s_g,
    cp:  NaN,
    cv:  NaN,
    k:   NaN,
    mu:  NaN
  };
}


/* ============================================================
   Root solvers
   ============================================================ */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

async function solveTfromH(P, h, region) {
  let lo = 273.15, hi = 1200;

  for (let i = 0; i < 500; i++) {
    const mid = 0.5 * (lo + hi);
    const hm =
      region === 1
        ? (await region1(mid, P)).h
        : (await region2(mid, P)).h;

    hm > h ? (hi = mid) : (lo = mid);
  }

  return 0.5 * (lo + hi);
}

async function solveTfromS(P, s, region) {
  let lo = 273.15, hi = 1200;

  for (let i = 0; i < 500; i++) {
    const mid = 0.5 * (lo + hi);
    const sm =
      region === 1
        ? (await region1(mid, P)).s
        : (await region2(mid, P)).s;

    sm > s ? (hi = mid) : (lo = mid);
  }

  return 0.5 * (lo + hi);
}
