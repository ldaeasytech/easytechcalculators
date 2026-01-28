// solver.js — IAPWS-95 authoritative, IF97 initial guess only

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

const SAT_EPS = 1e-6;
const X_EPS = 1e-10;

function isRegion5(T, P) {
  return T > 1073.15 && T <= 2273.15 && P <= 50.0;
}

/* ============================================================
   Main Solver
   ============================================================ */

export function solve(inputs) {
  let { mode } = inputs;
  if (mode === "Ps") mode = "Ts";

  /* ======================= T–P ======================= */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
    const Ps = Psat(T);

    // --- Saturated ---
    if (Math.abs(P - Ps) < SAT_EPS) {
      return withPhase("saturated_vapor", satVaporState(T), T, Ps);
    }

    // --- Single-phase ---
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
  let rho0;

  try {
    let g;
    if (P > Ps) g = region1(T, P);
    else if (isRegion5(T, P)) g = region5(T, P);
    else g = region2(T, P);

    rho0 = g.density;
  } catch {
    rho0 = NaN;
  }

  // Guard against non-physical IF97 results
  if (!Number.isFinite(rho0) || rho0 <= 0) {
    rho0 = P > Ps ? rho_f_sat(T) : rho_g_sat(T);
  }

  return rho0;
}

/* ============================================================
   IAPWS-95 single-phase wrapper
   ============================================================ */

function singlePhaseIAPWS(T, P, rho0, phase) {
  let rho;

  try {
    rho = solveDensity(T, P, rho0);
  } catch {
    rho = phase === "compressed_liquid"
      ? rho_f_sat(T)
      : rho_g_sat(T);
  }

  const r = iapwsProps(T, rho);

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
