// solver.js — IF97 dispatcher (FIXED)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat } from "./if97/region4.js";

const SAT_OFFSET = 5.0; // K — IAPWS recommended

export function solveState({ mode, T, P, x }) {

  /* ============================
     T – P MODE
     ============================ */
  if (mode === "TP") {

    const Ps = Psat(T);

    // Compressed / subcooled liquid
    if (P > Ps) {
      return {
        phase: "compressed_liquid",
        ...region1(T, P)
      };
    }

    // Saturated vapor → shift into Region 2
    if (Math.abs(P - Ps) < 1e-6) {
      return {
        phase: "saturated_vapor",
        ...region2(T + SAT_OFFSET, Ps)
      };
    }

    // Superheated vapor
    return {
      phase: "superheated_vapor",
      ...region2(T, P)
    };
  }

  /* ============================
     T – x MODE (TRUE Region 4)
     ============================ */
  if (mode === "Tx") {

    const Ps = Psat(T);

    const satL = region1(T, Ps);
    const satV = region2(T + SAT_OFFSET, Ps);

    // Saturated liquid
    if (x === 0) {
      return {
        phase: "saturated_liquid",
        ...satL
      };
    }

    // Saturated vapor
    if (x === 1) {
      return {
        phase: "saturated_vapor",
        ...satV
      };
    }

    // Two-phase mixture
    return {
      phase: "two_phase",
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
    };
    
  }

  throw new Error("Unsupported calculation mode");
}

export { solveState as solve };
