// solver.js — IF97 dispatcher (TX-SAFE, PHASE-LOCKED)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat } from "./if97/region4.js";

const SAT_OFFSET = 5.0;      // K — safe approach to Region 2
const X_EPS = 1e-9;          // quality tolerance

/* ============================================================
   Human-readable phase labels
   ============================================================ */
const PHASE_LABELS = {
  saturated_liquid: "Saturated Liquid",
  saturated_vapor: "Saturated Vapor",
  two_phase: "Two-Phase Mixture",
  superheated_vapor: "Superheated Vapor",
  compressed_liquid: "Compressed (Subcooled) Liquid"
};

function withPhase(key, props) {
  return {
    phase: key,
    phaseLabel: PHASE_LABELS[key],
    ...props
  };
}

/* ============================================================
   Solver
   ============================================================ */
export function solve(inputs) {
  const { mode } = inputs;

  /* ============================================================
     T – P MODE
     ============================================================ */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;

    const Ps = Psat(T);

    if (P > Ps) {
      return withPhase(
        "compressed_liquid",
        region1(T, P)
      );
    }

    if (Math.abs(P - Ps) < 1e-6) {
      return withPhase(
        "saturated_vapor",
        region2(T + SAT_OFFSET, Ps)
      );
    }

    return withPhase(
      "superheated_vapor",
      region2(T, P)
    );
  }

  /* ============================================================
     T – x MODE  (PHASE IS DEFINED BY x — NO EXCEPTIONS)
     ============================================================ */
  if (mode === "Tx") {
    const T = inputs.temperature;
    let x = Number(inputs.quality);

    // HARD clamp quality
    if (!Number.isFinite(x)) {
      throw new Error("Invalid vapor quality x");
    }
    x = Math.min(1, Math.max(0, x));

    const Ps = Psat(T);

    const satL = region1(T, Ps);
    const satV = region2(T + SAT_OFFSET, Ps);

    // x ≈ 0 → saturated liquid
    if (x < X_EPS) {
      return withPhase(
        "saturated_liquid",
        satL
      );
    }

    // x ≈ 1 → saturated vapor
    if (1 - x < X_EPS) {
      return withPhase(
        "saturated_vapor",
        satV
      );
    }

    // 0 < x < 1 → two-phase mixture
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
