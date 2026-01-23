// solver.js — IF97 dispatcher (TP, Tx, Px, Ph, Ps)
// Saturation-pure, offset-free, density-consistent

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Tsat, Psat } from "./if97/region4.js";

const X_EPS = 1e-9;
const SAT_TOL = 1e-6;

/* ============================================================
   Phase labels
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
   Saturation helpers (IF97-pure)
   ============================================================ */
function satLiquid(T, P) {
  return region1(T, P);
}

function satVapor(T, P) {
  // IF97 definition: saturated vapor is the limiting
  // superheated vapor at Tsat, Psat
  return region2(T, P);
}

/* ============================================================
   Solver entry
   ============================================================ */
export function solve(inputs) {
  const { mode } = inputs;

  /* ============================================================
     T – P
     ============================================================ */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;

    const Ps = Psat(T);

    if (P > Ps + SAT_TOL) {
      return withPhase("compressed_liquid", region1(T, P));
    }

    if (Math.abs(P - Ps) <= SAT_TOL) {
      return withPhase(
        "saturated_vapor",
        satVapor(T, Ps)
      );
    }

    return withPhase("superheated_vapor", region2(T, P));
  }

  /* ============================================================
     T – x
     ============================================================ */
  if (mode === "Tx") {
    const T = inputs.temperature;
    let x = Number(inputs.quality);

    if (!Number.isFinite(x)) throw new Error("Invalid vapor quality x");
    x = Math.min(1, Math.max(0, x));

    const P = Psat(T);
    const L = satLiquid(T, P);
    const V = satVapor(T, P);

    if (x < X_EPS) return withPhase("saturated_liquid", L);
    if (1 - x < X_EPS) return withPhase("saturated_vapor", V);

    return withPhase("two_phase", mix(L, V, x));
  }

  /* ============================================================
     P – x
     ============================================================ */
  if (mode === "Px") {
    const P = inputs.pressure;
    let x = Number(inputs.quality);

    if (!Number.isFinite(x)) throw new Error("Invalid vapor quality x");
    x = Math.min(1, Math.max(0, x));

    const T = Tsat(P);
    const L = satLiquid(T, P);
    const V = satVapor(T, P);

    if (x < X_EPS) return withPhase("saturated_liquid", L);
    if (1 - x < X_EPS) return withPhase("saturated_vapor", V);

    return withPhase("two_phase", mix(L, V, x));
  }

  /* ============================================================
     P – h
     ============================================================ */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const T = Tsat(P);
    const L = satLiquid(T, P);
    const V = satVapor(T, P);

    if (h < L.enthalpy) {
      return withPhase("compressed_liquid", region1(T, P));
    }

    if (h > V.enthalpy) {
      return withPhase("superheated_vapor", region2(T, P));
    }

    const x = (h - L.enthalpy) / (V.enthalpy - L.enthalpy);
    return withPhase("two_phase", mix(L, V, x));
  }

  /* ============================================================
     P – s
     ============================================================ */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;

    const T = Tsat(P);
    const L = satLiquid(T, P);
    const V = satVapor(T, P);

    if (s < L.entropy) {
      return withPhase("compressed_liquid", region1(T, P));
    }

    if (s > V.entropy) {
      return withPhase("superheated_vapor", region2(T, P));
    }

    const x = (s - L.entropy) / (V.entropy - L.entropy);
    return withPhase("two_phase", mix(L, V, x));
  }

  throw new Error(`Unsupported calculation mode: ${mode}`);
}

/* ============================================================
   Two-phase mixture (exact IF97 form)
   ============================================================ */
function mix(L, V, x) {
  return {
    density:
      1 / ((1 - x) / L.density + x / V.density),

    specificVolume:
      (1 - x) * L.specificVolume + x * V.specificVolume,

    enthalpy:
      (1 - x) * L.enthalpy + x * V.enthalpy,

    entropy:
      (1 - x) * L.entropy + x * V.entropy
  };
}
