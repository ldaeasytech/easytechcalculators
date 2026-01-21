// solver.js — IF97 dispatcher (SATURATION-SAFE & COHERENT)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { Psat } from "./if97/region4.js";

/*
  IMPORTANT:
  IF97 Region 2 is NOT defined exactly on the saturation line.
  Saturated vapor must be evaluated slightly inside Region 2.
*/
const SAT_OFFSET = 5.0; // K — numerical safety offset

export function solve(inputs) {
  const {
    mode,
    temperature: T,
    pressure: P,
    quality: x
  } = inputs;

  /* ============================================================
     T – P MODE
     ============================================================ */
  if (mode === "TP") {
    const Ps = Psat(T);

    // Compressed / subcooled liquid
    if (P > Ps) {
      return {
        phase: "compressed_liquid",
        ...region1(T, P)
      };
    }

    // Saturated vapor (approached from Region 2)
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

  /* ============================================================
     T – x MODE (TRUE REGION 4 HANDLING)
     ============================================================ */
  if (mode === "Tx") {
    const Ps = Psat(T);

    // Saturated liquid (Region 1)
    const satL = region1(T, Ps);

    // Saturated vapor (Region 2 approached safely)
    const satV = region2(T + SAT_OFFSET, Ps);

    // x = 0 → saturated liquid
    if (x === 0) {
      return {
        phase: "saturated_liquid",
        ...satL
      };
    }

    // x = 1 → saturated vapor
    if (x === 1) {
      return {
        phase: "saturated_vapor",
        ...satV
      };
    }

    // 0 < x < 1 → two-phase mixture
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
