// validator.js
// Input validation and state consistency checks
// INTERNAL UNITS:
//   temperature → K
//   pressure    → MPa
//   enthalpy    → kJ/kg
//   entropy     → kJ/(kg·K)
//   specificVolume → m³/kg
//   quality     → [-]

import {
  Tc,
  Pc,
  Tt,
  T_MIN,
  T_MAX,
  P_MIN,
  P_MAX,
  EPS
} from "./constants.js";

import { Psat } from "./if97/region4.js";

export function validateState(inputs) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  const {
    temperature: T,
    pressure: P,
    enthalpy: h,
    entropy: s,
    specificVolume: v,
    quality: x
  } = inputs;

  /* ============================================================
     Basic range checks
     ============================================================ */

  if (Number.isFinite(T)) {
    if (T < T_MIN || T > T_MAX) {
      errors.push("Temperature is outside the valid range.");
      suggestions.push(`Use ${T_MIN} K ≤ T ≤ ${T_MAX} K.`);
    }
  }

  if (Number.isFinite(P)) {
    if (P <= P_MIN || P > P_MAX) {
      errors.push("Pressure is outside the valid range.");
      suggestions.push(`Use ${P_MIN} < P ≤ ${P_MAX} MPa.`);
    }
  }

  if (Number.isFinite(x)) {
    if (x < 0 || x > 1) {
      errors.push("Quality must be between 0 and 1.");
    }
  }

  if (Number.isFinite(v) && v <= 0) {
    errors.push("Specific volume must be positive.");
  }

  /* ============================================================
     Saturation consistency (no property solving here)
     ============================================================ */

  if (Number.isFinite(T) && Number.isFinite(P)) {
    try {
      const Ps = Psat(T);
      if (Math.abs(P - Ps) / Ps < 1e-5) {
        warnings.push(
          "State lies on or very near the saturation line."
        );
        suggestions.push(
          "Provide vapor quality to fully define the two-phase state."
        );
      }
    } catch {
      // Outside saturation range → ignore
    }
  }

  if (Number.isFinite(x)) {
    if (!Number.isFinite(T) && !Number.isFinite(P)) {
      errors.push("Quality requires temperature or pressure.");
    }
  }

  /* ============================================================
     Order-of-magnitude checks (non-fatal)
     ============================================================ */

  if (Number.isFinite(h) && (h < -2000 || h > 8000)) {
    warnings.push("Enthalpy is outside typical physical bounds.");
  }

  if (Number.isFinite(s) && (s < -1 || s > 20)) {
    warnings.push("Entropy is outside typical physical bounds.");
  }

  /* ============================================================
     Independent property count
     ============================================================ */

  const defined = Object.entries({ T, P, h, s, v, x })
    .filter(([, val]) => Number.isFinite(val))
    .map(([key]) => key);

  if (defined.length < 2) {
    errors.push("At least two independent properties are required.");
  }

  if (defined.length > 2 && !defined.includes("x")) {
    warnings.push("System may be over-specified.");
    suggestions.push("Remove redundant inputs.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}
