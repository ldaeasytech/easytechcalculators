// solver.js — IF97 dispatcher (TP, Tx, Px, Ph, Ps SAFE)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat, Tsat } from "./if97/region4.js";

const SAT_OFFSET = 1e-6; // K — safe offset for Region 2
const X_EPS = 1e-9;

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

    if (P > Ps) {
      return withPhase("compressed_liquid", region1(T, P));
    }

    if (Math.abs(P - Ps) < 1e-6) {
      return withPhase(
        "saturated_vapor",
        region2(T + SAT_OFFSET, Ps)
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
    const satL = region1(T, P);
    const satV = region2(T + SAT_OFFSET, P);

    if (x < X_EPS) return withPhase("saturated_liquid", satL);
    if (1 - x < X_EPS) return withPhase("saturated_vapor", satV);

    return withPhase("two_phase", mix(satL, satV, x));
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
    const satL = region1(T, P);
    const satV = region2(T + SAT_OFFSET, P);

    if (x < X_EPS) return withPhase("saturated_liquid", satL);
    if (1 - x < X_EPS) return withPhase("saturated_vapor", satV);

    return withPhase("two_phase", mix(satL, satV, x));
  }

  /* ============================================================
     P – h
     ============================================================ */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const T_sat = Tsat(P);
    const h_f = region1(T_sat, P).enthalpy;
    const h_g = region2(T_sat + SAT_OFFSET, P).enthalpy;

    if (h < h_f) {
      return withPhase(
        "compressed_liquid",
        region1(T_sat, P)
      );
    }

    if (h > h_g) {
      return withPhase(
        "superheated_vapor",
        region2(T_sat + SAT_OFFSET, P)
      );
    }

    const x = (h - h_f) / (h_g - h_f);
    return withPhase(
      "two_phase",
      mix(
        region1(T_sat, P),
        region2(T_sat + SAT_OFFSET, P),
        x
      )
    );
  }

  /* ============================================================
     P – s
     ============================================================ */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;

    const T_sat = Tsat(P);
    const s_f = region1(T_sat, P).entropy;
    const s_g = region2(T_sat + SAT_OFFSET, P).entropy;

    if (s < s_f) {
      return withPhase(
        "compressed_liquid",
        region1(T_sat, P)
      );
    }

    if (s > s_g) {
      return withPhase(
        "superheated_vapor",
        region2(T_sat + SAT_OFFSET, P)
      );
    }

    const x = (s - s_f) / (s_g - s_f);
    return withPhase(
      "two_phase",
      mix(
        region1(T_sat, P),
        region2(T_sat + SAT_OFFSET, P),
        x
      )
    );
  }

  throw new Error(`Unsupported calculation mode: ${mode}`);
}

/* ============================================================
   Two-phase mixture helper
   ============================================================ */
function mix(L, V, x) {
  return {
    density: 1 / ((1 - x) / L.density + x / V.density),
    specificVolume:
      (1 - x) * L.specificVolume + x * V.specificVolume,
    enthalpy:
      (1 - x) * L.enthalpy + x * V.enthalpy,
    entropy:
      (1 - x) * L.entropy + x * V.entropy
  };
}
