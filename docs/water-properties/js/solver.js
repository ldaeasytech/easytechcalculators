// solver.js — FINAL IF97 SOLVER
// Saturation-forced, piecewise Tsat/Psat, paste-safe

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat, Tsat } from "./if97/region4.js";

console.log("Calling region2 with:", { P, T });


const X_EPS = 1e-9;

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

    if (Math.abs(P - Ps) < 1e-6) {
      const V = region2(T, Ps);
      return withPhase("saturated_vapor", V, T, Ps);
    }

    if (P > Ps) {
      const L = region1(T, P);
      return withPhase("compressed_liquid", L, T, P);
    }

    const V = region2(T, P);
    return withPhase("superheated_vapor", V, T, P);
  }

  /* ========================================================
     T–x MODE  (AUTHORITATIVE Psat)
     ======================================================== */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;

    const P = Psat(T);

    const L = region1(T, P);
    const V = region2(T, P);

    if (x <= X_EPS) {
      return withPhase("saturated_liquid", L, T, P);
    }

    if (1 - x <= X_EPS) {
      return withPhase("saturated_vapor", V, T, P);
    }

    return mixStates(L, V, x, T, P);
  }

  /* ========================================================
     P–x MODE  (AUTHORITATIVE Tsat)
     ======================================================== */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;

    const T = Tsat(P);

    const L = region1(T, P);
    const V = region2(T, P);

    if (x <= X_EPS) {
      return withPhase("saturated_liquid", L, T, P);
    }

    if (1 - x <= X_EPS) {
      return withPhase("saturated_vapor", V, T, P);
    }

    return mixStates(L, V, x, T, P);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   Helpers
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

   Cp: (phase.includes("saturated")) ? NaN : (r.Cp ?? r.cp ?? NaN),
   Cv: (phase.includes("saturated")) ? NaN : (r.Cv ?? r.cv ?? NaN)

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
    Cv: NaN
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
