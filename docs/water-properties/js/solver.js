// solver.js — IF97 dispatcher with HUMANIZED PHASE OUTPUT

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat } from "./if97/region4.js";

/*
  IF97 NOTE:
  Region 2 is not defined exactly on the saturation line.
  Saturated vapor is evaluated slightly inside Region 2.
*/
const SAT_OFFSET = 5.0; // K — numerical safety offset

/* ============================================================
   Phase label map (single source of truth)
   ============================================================ */
const PHASE_LABELS = {
  saturated_liquid: "Saturated Liquid",
  saturated_vapor: "Saturated Vapor",
  two_phase: "Two-Phase Mixture",
  superheated_vapor: "Superheated Vapor",
  compressed_liquid: "Compressed (Subcooled) Liquid"
};

function withPhase(phaseKey, props) {
  return {
    phase: phaseKey,
    phaseLabel: PHASE_LABELS[phaseKey] ?? phaseKey,
    ...props
  };
}

/* ============================================================
   Main solver
   ============================================================ */
export function solve(inputs) {
  const { mode } = inputs;

  /* ============================
     T – P MODE
     ============================ */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;

    const Ps = Psat(T);

    // Compressed / subcooled liquid
    if (P > Ps) {
      return withPhase(
        "compressed_liquid",
        region1(T, P)
      );
    }

    // Saturated vapor (approached from Region 2)
    if (Math.abs(P - Ps) < 1e-6) {
      return withPhase(
        "saturated_vapor",
        region2(T + SAT_OFFSET, Ps)
      );
    }

    // Superheated vapor
    return withPhase(
      "superheated_vapor",
      region2(T, P)
    );
  }

  /* ============================
     T – x MODE (EXPLICIT SATURATION)
     ============================ */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;

    // Pressure MUST come from Region 4 — never from UI
    const Ps = Psat(T);

    const satL = region1(T, Ps);
    const satV = region2(T + SAT_OFFSET, Ps);

    // Saturated liquid
    if (x === 0) {
      return withPhase(
        "saturated_liquid",
        satL
      );
    }

    // Saturated vapor
    if (x === 1) {
      return withPhase(
        "saturated_vapor",
        satV
      );
    }

    // Two-phase mixture
    return withPhase(
      "two_phase",
      {
        density:
          1 / ((1 - x) / satL.density + x / satV.density),

        specificVolume:
          (1 - x) * satL.specificVolume +
          x * satV.specificVolume,

        enthalpy:
          (1 - x) * satL.enthalpy +
          x * satV.enthalpy,

        entropy:
          (1 - x) * satL.entropy +
          x * satV.entropy
      }
    );
  }

  throw new Error("Unsupported calculation mode");
}
