// solver.js — Fully lazy + safe IF97 solver

const SAT_EPS = 1e-6;
const X_EPS = 1e-10;

const SINGLE_PHASE_LABEL = {
  1: "Compressed liquid",
  2: "Superheated vapor",
  3: "Compressed liquid"
};

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

export async function solve(inputs) {
  const { mode } = inputs;

  // Import once per solve
  const r4 = await import("./if97/region4.js");
  const { regionSelector } = await import("./if97/regionSelector.js");

  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
    const Ps = r4.Psat(T);

    if (Math.abs(P - Ps) < SAT_EPS) {
      return formatOutput(await satVaporState(T, Ps, r4), mode);
    }

    return formatOutput(await singlePhaseIF97(T, P, regionSelector), mode);
  }

  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const rgn = regionSelector({ P, h, mode: "Ph" });

    if (rgn === 4) {
      const T = r4.Tsat(P);
      const hf = r4.h_f_sat(T);
      const hg = r4.h_g_sat(T);
      const x = clamp01((h - hf) / (hg - hf));

      if (x <= X_EPS) return formatOutput(await satLiquidState(T, P, r4), mode);
      if (1 - x <= X_EPS) return formatOutput(await satVaporState(T, P, r4), mode);
      return formatOutput(await mixStates(T, P, x, r4), mode);
    }

    const T = await solveTfromH(P, h, rgn);
    return formatOutput(await singlePhaseIF97(T, P, regionSelector), mode);
  }

  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;

    const rgn = regionSelector({ P, s, mode: "Ps" });

    if (rgn === 4) {
      const T = r4.Tsat(P);
      const sf = r4.s_f_sat(T);
      const sg = r4.s_g_sat(T);
      const x = clamp01((s - sf) / (sg - sf));

      if (x <= X_EPS) return formatOutput(await satLiquidState(T, P, r4), mode);
      if (1 - x <= X_EPS) return formatOutput(await satVaporState(T, P, r4), mode);
      return formatOutput(await mixStates(T, P, x, r4), mode);
    }

    const T = await solveTfromS(P, s, rgn);
    return formatOutput(await singlePhaseIF97(T, P, regionSelector), mode);
  }

  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = r4.Psat(T);

    if (x <= X_EPS) return formatOutput(await satLiquidState(T, P, r4), mode);
    if (1 - x <= X_EPS) return formatOutput(await satVaporState(T, P, r4), mode);
    return formatOutput(await mixStates(T, P, x, r4), mode);
  }

  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    const T = r4.Tsat(P);

    if (x <= X_EPS) return formatOutput(await satLiquidState(T, P, r4), mode);
    if (1 - x <= X_EPS) return formatOutput(await satVaporState(T, P, r4), mode);
    return formatOutput(await mixStates(T, P, x, r4), mode);
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

async function singlePhaseIF97(T, P, regionSelector) {
  const rgn = regionSelector({ T, P, mode: "TP" });

  if (rgn === 1) {
    const { region1 } = await import("./if97/region1.js");
    const props = await region1(T, P);
    return { phase: "single_phase", phaseLabel: SINGLE_PHASE_LABEL[rgn], temperature: T, pressure: P, ...props };
  }

  if (rgn === 2) {
    const mod = await import("./if97/region2.js");
    const props = await mod.default(T, P);
    return { phase: "single_phase", phaseLabel: SINGLE_PHASE_LABEL[rgn], temperature: T, pressure: P, ...props };
  }

  if (rgn === 3) {
    const { region3 } = await import("./if97/region3.js");
    const props = region3(T, P);
    return { phase: "single_phase", phaseLabel: SINGLE_PHASE_LABEL[rgn], temperature: T, pressure: P, ...props };
  }

  throw new Error(`Invalid region: ${rgn}`);
}

async function satLiquidState(T, P, r4) {
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

async function satVaporState(T, P, r4) {
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

async function mixStates(T, P, x, r4) {
  const v_f = r4.v_f_sat(T);
  const v_g = r4.v_g_sat(T);

  return {
    phase: "two_phase",
    phaseLabel: "Two-phase",
    quality: x,
    temperature: T,
    pressure: P,
    v: (1 - x) * v_f + x * v_g,
    rho: 1 / ((1 - x) * v_f + x * v_g),
    h: (1 - x) * r4.h_f_sat(T) + x * r4.h_g_sat(T),
    s: (1 - x) * r4.s_f_sat(T) + x * r4.s_g_sat(T),
    cp: NaN,
    cv: NaN,
    k: NaN,
    mu: NaN
  };
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
