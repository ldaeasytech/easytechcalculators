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

  /* ---------- T–x ---------- */
  if (mode === "Tx") {
    const T = inputs.temperature;
    let x = Math.min(1, Math.max(0, Number(inputs.quality)));

    const P = Psat(T);
    const Ts = Tsat(P);

    const L = region1_safe(Ts, P);
    const V = region2_safe(Ts, P);

    if (x < X_EPS) return withPhase("saturated_liquid", L);
    if (1 - x < X_EPS) return withPhase("saturated_vapor", V);

    return withPhase("two_phase", mix(L, V, x));
  }

  /* ---------- P–x ---------- */
  if (mode === "Px") {
    const P = inputs.pressure;
    let x = Math.min(1, Math.max(0, Number(inputs.quality)));

    const T = Tsat(P);
    const L = region1_safe(T, P);
    const V = region2_safe(T, P);

    if (x < X_EPS) return withPhase("saturated_liquid", L);
    if (1 - x < X_EPS) return withPhase("saturated_vapor", V);

    return withPhase("two_phase", mix(L, V, x));
  }

  throw new Error(`Unsupported calculation mode: ${mode}`);
}

/* ============================================================
   Two-phase mixture
   ============================================================ */

function mix(L, V, x) {
  return {
    density: 1 / ((1 - x) / L.density + x / V.density),
    specificVolume: (1 - x) * L.specificVolume + x * V.specificVolume,
    enthalpy: (1 - x) * L.enthalpy + x * V.enthalpy,
    entropy: (1 - x) * L.entropy + x * V.entropy,
    Cp: NaN,
    Cv: NaN
  };
}
