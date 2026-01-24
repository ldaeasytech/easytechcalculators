// solver.js — FINAL IF97 SOLVER
// Saturation-locked, Region-4 authoritative

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";

import {
  Psat,
  Tsat,

  // saturated liquid
  rho_f_sat,
  v_f_sat,
  h_f_sat,
  s_f_sat,
  cp_f_sat,
  cv_f_sat,
  k_f_sat,
  mu_f_sat,

  // saturated vapor
  rho_g_sat,
  v_g_sat,
  h_g_sat,
  s_g_sat,
  cp_g_sat,
  cv_g_sat,
  k_g_sat,
  mu_g_sat
} from "./if97/region4.js";

const X_EPS = 1e-9;
const SAT_EPS = 1e-6;

/* ============================================================
   Solver entry point
   ============================================================ */

export function solve(inputs) {
  const { mode } = inputs;

  /* ========================================================
     T–P MODE
     ======================================================== */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
    const Ps = Psat(T);

    // Saturation lock
    if (Math.abs(P - Ps) < SAT_EPS) {
      const V = satVaporState(T, Ps);
      return withPhase("saturated_vapor", V, T, Ps);
    }

    // Compressed liquid
    if (P > Ps) {
      const L = region1(T, P);
      return withPhase("compressed_liquid", L, T, P);
    }

    // Superheated vapor
    const V = region2(T, P);
    return withPhase("superheated_vapor", V, T, P);
  }

  /* ========================================================
     T–x MODE  (Psat authoritative)
     ======================================================== */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = Psat(T);

    if (x <= X_EPS) {
      const L = satLiquidState(T, P);
      return withPhase("saturated_liquid", L, T, P);
    }

    if (1 - x <= X_EPS) {
      const V = satVaporState(T, P);
      return withPhase("saturated_vapor", V, T, P);
    }

    const L = satLiquidState(T, P);
    const V = satVaporState(T, P);
    return mixStates(L, V, x, T, P);
  }

  /* ========================================================
     P–x MODE  (Tsat authoritative)
     ======================================================== */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    const T = Tsat(P);

    if (x <= X_EPS) {
      const L = satLiquidState(T, P);
      return withPhase("saturated_liquid", L, T, P);
    }

    if (1 - x <= X_EPS) {
      const V = satVaporState(T, P);
      return withPhase("saturated_vapor", V, T, P);
    }

    const L = satLiquidState(T, P);
    const V = satVaporState(T, P);
    return mixStates(L, V, x, T, P);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   Saturation helpers (Region-4 only)
   ============================================================ */

function satLiquidState(T, P) {
  return {
    density: rho_f_sat(T),
    specificVolume: v_f_sat(T),
    enthalpy: h_f_sat(T),
    entropy: s_f_sat(T),
    Cp: cp_f_sat(T),
    Cv: cv_f_sat(T),
    k: k_f_sat(T),
    mu: mu_f_sat(T)
  };
}

function satVaporState(T, P) {
  return {
    density: rho_g_sat(T),
    specificVolume: v_g_sat(T),
    enthalpy: h_g_sat(T),
    entropy: s_g_sat(T),
    Cp: cp_g_sat(T),
    Cv: cv_g_sat(T),
    k: k_g_sat(T),
    mu: mu_g_sat(T)
  };
}

/* ============================================================
   Output helpers
   ============================================================ */

function withPhase(phase, r, T, P) {
  return {
    T,
    P,
    phase,
    phaseLabel: phaseLabel(phase),

    density: r.density,
    specificVolume: r.specificVolume,
    enthalpy: r.enthalpy,
    entropy: r.entropy,

    Cp: r.Cp ?? r.cp ?? NaN,
    Cv: r.Cv ?? r.cv ?? NaN,

    thermalConductivity: r.k ?? NaN,
    viscosity: r.mu ?? NaN
  };
}

function mixStates(L, V, x, T, P) {
  const v =
    (1 - x) * L.specificVolume +
    x * V.specificVolume;

  return {
    T,
    P,
    phase: "two_phase",
    phaseLabel: "Two-Phase Mixture",

    specificVolume: v,
    density: 1 / v,

    enthalpy:
      (1 - x) * L.enthalpy +
      x * V.enthalpy,

    entropy:
      (1 - x) * L.entropy +
      x * V.entropy,

    Cp: NaN,
    Cv: NaN,
    thermalConductivity: NaN,
    viscosity: NaN
  };
}

function phaseLabel(key) {
  switch (key) {
    case "compressed_liquid":
      return "Compressed (Subcooled) Liquid";
    case "saturated_liquid":
      return "Saturated Liquid";
    case "saturated_vapor":
      return "Saturated Vapor";
    case "two_phase":
      return "Two-Phase Mixture";
    case "superheated_vapor":
      return "Superheated Vapor";
    default:
      return "";
  }
}
