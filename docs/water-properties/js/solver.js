// solver.js
import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { saturationPressure_T } from "./if97/region4.js";

export function solveState({ mode, T, P, x }) {

  // ================================
  // T – P MODE
  // ================================
  if (mode === "TP") {

    // saturation pressure at T
    const Psat = saturationPressure_T(T);

    // compressed liquid
    if (P > Psat) {
      return {
        phase: "compressed_liquid",
        ...region1(T, P)
      };
    }

    // saturated vapor or superheated vapor
    return {
      phase: P === Psat ? "saturated_vapor" : "superheated_vapor",
      ...region2(T, P)
    };
  }

  // ================================
  // T – x MODE (Region 4 handled CORRECTLY)
  // ================================
  if (mode === "Tx") {

    // 1. Get saturation pressure
    const Psat = saturationPressure_T(T);

    // 2. Saturated liquid and vapor properties
    const satL = region1(T, Psat);
    const satV = region2(T, Psat);

    // ----- Saturated liquid -----
    if (x === 0) {
      return {
        phase: "saturated_liquid",
        ...satL
      };
    }

    // ----- Saturated vapor -----
    if (x === 1) {
      return {
        phase: "saturated_vapor",
        ...satV
      };
    }

    // ----- Two-phase mixture -----
    const mix = {
      density:
        1 / ((1 - x) / satL.density + x / satV.density),

      specificVolume:
        (1 - x) * satL.specificVolume + x * satV.specificVolume,

      enthalpy:
        (1 - x) * satL.enthalpy + x * satV.enthalpy,

      entropy:
        (1 - x) * satL.entropy + x * satV.entropy
    };

    return {
      phase: "two_phase",
      ...mix
    };
  }

  throw new Error("Unsupported calculation mode");
}
