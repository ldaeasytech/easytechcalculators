// solver.js — IF97 dispatcher (TX/PX-SAFE, PHASE-LOCKED)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat } from "./if97/region4.js";

const SAT_OFFSET = 5.0; // K — safe approach to Region 2
const X_EPS = 1e-9;     // quality tolerance

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
     T – x MODE  (PHASE DEFINED BY x)
     ============================================================ */
  if (mode === "Tx") {
    const T = inputs.temperature;
    let x = Number(inputs.quality);

    if (!Number.isFinite(x)) {
      throw new Error("Invalid vapor quality x");
    }
    x = Math.min(1, Math.max(0, x));

    const Ps = Psat(T);

    const satL = region1(T, Ps);
    const satV = region2(T + SAT_OFFSET, Ps);

    if (x < X_EPS) {
      return withPhase("saturated_liquid", satL);
    }

    if (1 - x < X_EPS) {
      return withPhase("saturated_vapor", satV);
    }

    return withPhase(
      "two_phase",
      mixProps(satL, satV, x)
    );
  }

  /* ============================================================
     P – x MODE  ✅ NEW (IDENTICAL LOGIC, DIFFERENT SAT CALL)
     ============================================================ */
  if (mode === "Px") {
    const P = inputs.pressure;
    let x = Number(inputs.quality);

    if (!Number.isFinite(x)) {
      throw new Error("Invalid vapor quality x");
    }
    x = Math.min(1, Math.max(0, x));

    // Saturation temperature from inverse Psat(T)
    const T = inversePsat(P);

    const satL = region1(T, P);
    const satV = region2(T + SAT_OFFSET, P);

    if (x < X_EPS) {
      return withPhase("saturated_liquid", satL);
    }

    if (1 - x < X_EPS) {
      return withPhase("saturated_vapor", satV);
    }

    return withPhase(
      "two_phase",
      mixProps(satL, satV, x)
    );
  }

  throw new Error("Unsupported calculation mode");
}

/* ============================================================
   Helpers
   ============================================================ */
function mixProps(f, g, x) {
  return {
    density:
      1 / ((1 - x) / f.density + x / g.density),

    specificVolume:
      (1 - x) * f.specificVolume +
      x * g.specificVolume,

    enthalpy:
      (1 - x) * f.enthalpy +
      x * g.enthalpy,

    entropy:
      (1 - x) * f.entropy +
      x * g.entropy
  };
}

/* ============================================================
   Simple Psat inversion (bisection, stable)
   ============================================================ */
function inversePsat(P) {
  let Tlow = 273.15;
  let Thigh = 647.096;

  for (let i = 0; i < 60; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);
    const Pmid = Psat(Tmid);
    if (Pmid > P) Thigh = Tmid;
    else Tlow = Tmid;
  }
  return 0.5 * (Tlow + Thigh);
}
