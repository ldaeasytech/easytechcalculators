// solver.js — Hybrid IF97 / IAPWS-95 solver
// IAPWS-95 is authoritative for single-phase
// IF97 used only for saturation and initial guesses

/* ============================================================
   Imports
   ============================================================ */

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region5 } from "./if97/region5.js";

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

import { solveDensity } from "./iapws95/solver.js";
import { properties as iapwsProps } from "./iapws95/properties.js";

import { conductivity } from "./if97/conductivity.js";
import { viscosity } from "./if97/viscosity.js";

/* ============================================================
   Constants
   ============================================================ */

const DEBUG_IAPWS = true;

const SAT_EPS = 1e-6;
const X_EPS = 1e-10;
const T_TOL = 1e-7;
const P_TOL = 1e-10;
const MAX_IT = 200;

// Water vapor specific gas constant [J/(kg·K)]
const R_WATER = 461.526;

function isRegion5(T, P) {
  return T > 1073.15 && T <= 2273.15 && P <= 50.0;
}

/* ============================================================
   Main solver
   ============================================================ */

export function solve(inputs) {
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

    const phase = P > Ps ? "compressed_liquid" : "superheated_steam";
    const rho0 = initialDensityGuess(T, P, Ps, phase);

    if (DEBUG_IAPWS) {
      console.log("[TP] Phase detection:", {
        T,
        P_MPa: P,
        Ps_MPa: Ps,
        phase,
        rho0_initial: rho0
      });
    }

    return singlePhaseIAPWS(T, P, rho0, phase);
  }

  /* ======================= P–h ======================= */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const Ts = Tsat(P);
    const hf = h_f_sat(Ts);
    const hg = h_g_sat(Ts);

    if (h >= hf && h <= hg) {
      const x = clamp01((h - hf) / (hg - hf));
      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(Ts), Ts, P);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(Ts), Ts, P);
      return mixStates(satLiquidState(Ts), satVaporState(Ts), x, Ts, P);
    }

    const T = solveT(P, h, T =>
      h < hf
        ? region1(T, P).enthalpy
        : isRegion5(T, P)
          ? region5(T, P).enthalpy
          : region2(T, P).enthalpy
    );

    const Ps = Psat(T);
    const phase = P > Ps ? "compressed_liquid" : "superheated_steam";
    const rho0 = initialDensityGuess(T, P, Ps, phase);

    return singlePhaseIAPWS(T, P, rho0, phase);
  }

  /* ======================= T–s ======================= */
  if (mode === "Ts") {
    const T = inputs.temperature;
    const s = inputs.entropy;

    const Ps = Psat(T);
    const sf = s_f_sat(T);
    const sg = s_g_sat(T);

    if (s >= sf && s <= sg) {
      const x = clamp01((s - sf) / (sg - sf));
      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, Ps);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, Ps);
      return mixStates(satLiquidState(T), satVaporState(T), x, T, Ps);
    }

    const P = solveP(T, s, P =>
      P > Ps
        ? region1(T, P).entropy
        : isRegion5(T, P)
          ? region5(T, P).entropy
          : region2(T, P).entropy
    );

    const phase = P > Ps ? "compressed_liquid" : "superheated_steam";
    const rho0 = initialDensityGuess(T, P, Ps, phase);

    return singlePhaseIAPWS(T, P, rho0, phase);
  }

  /* ======================= T–x (UNCHANGED) ======================= */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = Psat(T);

    if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  /* ======================= P–x (UNCHANGED) ======================= */
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
   Initial density guess
   ============================================================ */

function initialDensityGuess(T, P_MPa, Ps_MPa, phase) {
  let rho0;

  try {
    if (phase === "compressed_liquid") {
      rho0 = region1(T, P_MPa).density;
    } else {
      const P_Pa = P_MPa * 1e6;
      rho0 = P_Pa / (R_WATER * T);
    }
  } catch {
    rho0 = NaN;
  }

  if (!Number.isFinite(rho0) || rho0 <= 0) {
    rho0 = phase === "compressed_liquid"
      ? rho_f_sat(T)
      : rho_g_sat(T);
  }

  return rho0;
}

/* ============================================================
   IAPWS-95 wrapper
   ============================================================ */

function singlePhaseIAPWS(T, P, rho0, phase) {
  let rho;

  if (DEBUG_IAPWS) {
    console.log("[IAPWS] Enter:", { T, P_MPa: P, phase, rho0 });
  }

  try {
    rho = solveDensity(T, P, rho0);

    if (DEBUG_IAPWS) {
      console.log("[IAPWS] Converged:", {
        rho,
        deviation_pct: 100 * (rho - rho0) / rho0
      });
    }
  } catch (err) {
    console.warn("[IAPWS] Density solver failed, fallback used:", err);

    rho = phase === "compressed_liquid"
      ? rho_f_sat(T)
      : rho_g_sat(T);
  }

  const r = iapwsProps(T, rho);

   /* ======================= DEBUG LOG ======================= */
if (DEBUG_IAPWS) {
  console.group("[IAPWS-95] Thermodynamic properties");
  console.log("Input:", {
    T_K: T,
    P_MPa: P,
    rho_kg_m3: rho
  });

  console.log("Raw IAPWS-95 output:", {
    density: r.density,
    specificVolume: r.specificVolume,
    enthalpy_kJkg: r.enthalpy,
    entropy_kJkgK: r.entropy,
    internalEnergy_kJkg: r.internalEnergy,
    cp_kJkgK: r.cp,
    cv_kJkgK: r.cv
  });
  console.groupEnd();
}
/* ========================================================= */
   

  const out = {
    phase,
    phaseLabel: phase,
    temperature: T,
    pressure: P,
    ...r
  };

  const rho_cgs = rho * 1e-3;
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
   Generic solvers (IF97 helpers only)
   ============================================================ */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function solveT(P, target, f) {
  let lo = 273.15, hi = 2273.15;
  let flo = f(lo) - target;

  for (let i = 0; i < MAX_IT; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid) - target;
    if (Math.abs(hi - lo) < T_TOL) return mid;
    if (flo * fmid <= 0) hi = mid;
    else { lo = mid; flo = fmid; }
  }
  return 0.5 * (lo + hi);
}

function solveP(T, target, f) {
  let lo = 0.000611, hi = 100.0;
  let flo = f(lo) - target;

  for (let i = 0; i < MAX_IT; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid) - target;
    if (Math.abs(hi - lo) < P_TOL) return mid;
    if (flo * fmid <= 0) hi = mid;
    else { lo = mid; flo = fmid; }
  }
  return 0.5 * (lo + hi);
}
