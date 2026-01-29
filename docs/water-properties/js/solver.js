// solver.js — IAPWS-95 authoritative EOS
// IF97 used ONLY for initial density guesses

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

const DEBUG_IAPWS = true; // set false to silence logs


const SAT_EPS = 1e-6;
const X_EPS = 1e-10;
const T_TOL = 1e-7;
const P_TOL = 1e-10;
const MAX_IT = 200;

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
    const rho0 = initialDensityGuess(T, P, Ps);

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

    // ---- Saturated / two-phase ----
    if (h >= hf && h <= hg) {
      const x = clamp01((h - hf) / (hg - hf));
      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(Ts), Ts, P);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(Ts), Ts, P);
      return mixStates(satLiquidState(Ts), satVaporState(Ts), x, Ts, P);
    }

    // ---- Single-phase: solve T using IF97 as helper ----
    const T = solveT(P, h, T =>
      h < hf
        ? region1(T, P).enthalpy
        : isRegion5(T, P)
          ? region5(T, P).enthalpy
          : region2(T, P).enthalpy
    );

    const Ps = Psat(T);
    const phase = P > Ps ? "compressed_liquid" : "superheated_steam";
    const rho0 = initialDensityGuess(T, P, Ps);

    return singlePhaseIAPWS(T, P, rho0, phase);
  }

  /* ======================= T–s ======================= */
  if (mode === "Ts") {
    const T = inputs.temperature;
    const s = inputs.entropy;

    const Ps = Psat(T);
    const sf = s_f_sat(T);
    const sg = s_g_sat(T);

    // ---- Saturated / two-phase ----
    if (s >= sf && s <= sg) {
      const x = clamp01((s - sf) / (sg - sf));
      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, Ps);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, Ps);
      return mixStates(satLiquidState(T), satVaporState(T), x, T, Ps);
    }

    // ---- Single-phase: solve P using IF97 as helper ----
    const P = solveP(T, s, P =>
      P > Ps
        ? region1(T, P).entropy
        : isRegion5(T, P)
          ? region5(T, P).entropy
          : region2(T, P).entropy
    );

    const phase = P > Ps ? "compressed_liquid" : "superheated_steam";
    const rho0 = initialDensityGuess(T, P, Ps);

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
   Initial density logic
   ============================================================ */

function initialDensityGuess(T, P, Ps) {
  let rho;

  try {
    let g;
    if (P > Ps) g = region1(T, P);
    else if (isRegion5(T, P)) g = region5(T, P);
    else g = region2(T, P);
    rho = g.density;
  } catch {
    rho = NaN;
  }

  if (!Number.isFinite(rho) || rho <= 0) {
    rho = P > Ps ? rho_f_sat(T) : rho_g_sat(T);
  }

  return rho;
}

/* ============================================================
   IAPWS-95 wrapper
   ============================================================ */

function singlePhaseIAPWS(T, P, rho0, phase) {
  let rho;

   if (DEBUG_IAPWS) {
  console.log("[TP] Phase detection:", {
    T,
    P_MPa: P,
    Ps_MPa: Ps,
    phase,
    rho0_initial: rho0
  });
}

  try {
    rho = solveDensity(T, P, rho0);
    
     if (DEBUG_IAPWS) {
      console.log("[IAPWS] Density converged:", {
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

  const out = {
    phase,
    phaseLabel: phase,
    temperature: T,
    pressure: P, // keep UI units consistent
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
  let flo = f(lo) - target, fhi = f(hi) - target;

  for (let i = 0; i < MAX_IT; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid) - target;
    if (Math.abs(hi - lo) < T_TOL) return mid;
    if (flo * fmid <= 0) {
      hi = mid; fhi = fmid;
    } else {
      lo = mid; flo = fmid;
    }
  }
  return 0.5 * (lo + hi);
}

function solveP(T, target, f) {
  let lo = 0.000611, hi = 100.0;
  let flo = f(lo) - target, fhi = f(hi) - target;

  for (let i = 0; i < MAX_IT; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid) - target;
    if (Math.abs(hi - lo) < P_TOL) return mid;
    if (flo * fmid <= 0) {
      hi = mid; fhi = fmid;
    } else {
      lo = mid; flo = fmid;
    }
  }
  return 0.5 * (lo + hi);
}
