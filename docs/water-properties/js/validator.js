// validator.js — MODE-AWARE, NON-MUTATING, Tx-SAFE

import {
  T_MIN,
  T_MAX,
  P_MIN,
  P_MAX
} from "./constants.js";

import { Psat } from "./if97/region4.js";

/**
 * Validate user inputs ONLY.
 * Never infer phase.
 * Never mutate inputs.
 * Never override mode.
 */
export function validateState(inputs) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  const {
    mode,
    temperature: T,
    pressure: P,
    enthalpy: h,
    entropy: s,
    quality: x
  } = inputs;

  /* ============================================================
     Temperature
     ============================================================ */

  if (Number.isFinite(T) && (T < T_MIN || T > T_MAX)) {
    errors.push("Temperature is outside the valid range.");
  }

  /* ============================================================
     Pressure
     ============================================================ */

  if (Number.isFinite(P) && (P <= P_MIN || P > P_MAX)) {
    errors.push("Pressure is outside the valid range.");
  }

  /* ============================================================
     Quality
     ============================================================ */

  if (Number.isFinite(x)) {
    if (x < 0 || x > 1) {
      errors.push("Quality must be between 0 and 1.");
    }

    if (mode !== "Tx") {
      warnings.push(
        "Quality is ignored unless Temperature–Quality (T–x) mode is selected."
      );
    }
  }

  /* ============================================================
     MODE-SPECIFIC VALIDATION
     ============================================================ */

  switch (mode) {
    case "TP":
      if (!Number.isFinite(T) || !Number.isFinite(P)) {
        errors.push(
          "Temperature and Pressure are required in T–P mode."
        );
      }
      break;

    case "Ph":
      if (!Number.isFinite(P) || !Number.isFinite(h)) {
        errors.push(
          "Pressure and Enthalpy are required in P–h mode."
        );
      }
      break;

    case "Ps":
      if (!Number.isFinite(P) || !Number.isFinite(s)) {
        errors.push(
          "Pressure and Entropy are required in P–s mode."
        );
      }
      break;

    case "Tx":
      if (!Number.isFinite(T) || !Number.isFinite(x)) {
        errors.push(
          "Temperature and Quality are required in T–x mode."
        );
      }
      break;

    default:
      errors.push("Unknown calculation mode.");
  }

  /* ============================================================
     Saturation proximity (TP mode only)
     ============================================================ */

  if (mode === "TP" && Number.isFinite(T) && Number.isFinite(P)) {
    try {
      const Ps = Psat(T);
      if (Math.abs(P - Ps) / Ps < 1e-5) {
        warnings.push("State is very close to saturation.");
        suggestions.push(
          "Consider switching to Temperature–Quality (T–x) mode."
        );
      }
    } catch {
      // ignore saturation errors
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}
