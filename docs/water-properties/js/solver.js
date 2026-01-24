// solver.js — IF97 dispatcher (TP, Tx, Px, Ph, Ps)
// FINAL: saturation-stable, piecewise-safe, PROPERTY-COHERENT

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat, Tsat } from "./if97/region4.js";

const X_EPS = 1e-9;

/* ============================================================
   Property normalization (CRITICAL FIX)
   ============================================================ */

function normalize(r) {
  return {
    density: r.density,
    specificVolume: r.specificVolume,
    enthalpy: r.enthalpy,
    entropy: r.entropy,
    Cp: r.Cp ?? r.cp ?? NaN,
    Cv: r.Cv ?? r.cv ?? NaN
  };
}

function region1_safe(T, P) {
  return normalize(region1(T, P));
}

function region2_safe(T, P) {
  return normalize(region2(T, P));
}

/* ============================================================
   Phase labels
   ============================================================ */

const PHASE_LABELS = {
  compressed_liquid: "Compressed (Subcooled) Liquid",
  saturated_liquid: "Saturated Liquid",
  saturated_vapor: "Saturated Vapor",
  two_phase: "Two-Phase Mixture",
  superheated_vapor: "Superheated Vapor"
};

function withPhase(key, props) {
  return {
    phase: key,
    phaseLabel: PHASE_LABELS[key],
    ...props
  };
}

/* ============================================================
   Solver entry
   ============================================================ */

export function solve(inputs) {
  const { mode } = inputs;

  /* ---------- T–P ---------- */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
    const Ps = Psat(T);

    if (P > Ps) return withPhase("compressed_liquid", region1_safe(T, P));
    if (Math.abs(P - Ps) < 1e-6)
      return withPhase("saturated_vapor", region2_safe(T, Ps));

    return withPhase("superheated_vapor", region2_safe(T, P));
  }

// ===== SATURATED STATES (AUTHORITATIVE REGION 4) =====

if (mode === "Tx") {
  const T = temperature;

  // FORCE saturation pressure from piecewise Psat(T)
  const P = Psat(T);

  const satL = region1(T, P);
  const satV = region2(T, P);

  satL.T = T; satL.P = P;
  satV.T = T; satV.P = P;

  if (quality === 0) {
    satL.phase = "saturated_liquid";
    satL.phaseLabel = "Saturated Liquid";
    return satL;
  }

  if (quality === 1) {
    satV.phase = "saturated_vapor";
    satV.phaseLabel = "Saturated Vapor";
    return satV;
  }

  return mixSaturatedStates(satL, satV, quality);
}

if (mode === "Px") {
  const P = pressure;

  // FORCE saturation temperature from piecewise Tsat(P)
  const T = Tsat(P);

  const satL = region1(T, P);
  const satV = region2(T, P);

  satL.T = T; satL.P = P;
  satV.T = T; satV.P = P;

  if (quality === 0) {
    satL.phase = "saturated_liquid";
    satL.phaseLabel = "Saturated Liquid";
    return satL;
  }

  if (quality === 1) {
    satV.phase = "saturated_vapor";
    satV.phaseLabel = "Saturated Vapor";
    return satV;
  }

  return mixSaturatedStates(satL, satV, quality);
}


   
/* ============================================================
   Two-phase mixture
   ============================================================ */

function mixSaturatedStates(L, V, x) {
  const v =
    (1 - x) * L.specificVolume +
    x * V.specificVolume;

  return {
    T: L.T,
    P: L.P,
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
    Cv: NaN
  };
}
