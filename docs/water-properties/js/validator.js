// validator.js
// Input validation and state consistency checks

import {
  T_MIN,
  T_MAX,
  P_MIN,
  P_MAX
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

  if (Number.isFinite(T) && (T < T_MIN || T > T_MAX)) {
    errors.push("Temperature is outside the valid range.");
  }

  if (Number.isFinite(P) && (P <= P_MIN || P > P_MAX)) {
    errors.push("Pressure is outside the valid range.");
  }

  if (Number.isFinite(x) && (x < 0 || x > 1)) {
    errors.push("Quality must be between 0 and 1.");
  }

  if (Number.isFinite(v) && v <= 0) {
    errors.push("Specific volume must be positive.");
  }

  /* ============================================================
     Quality consistency
     ============================================================ */

  if (Number.isFinite(x)) {
    const countTP = Number.isFinite(T) + Number.isFinite(P);
    if (countTP !== 1) {
      errors.push(
        "Quality requires exactly one of temperature or pressure."
      );
    }
  }

  /* ============================================================
     Saturation proximity warnings
     ============================================================ */

  if (Number.isFinite(T) && Number.isFinite(P)) {
    try {
      const Ps = Psat(T);
      if (Math.abs(P - Ps) / Ps < 1e-5) {
        warnings.push("State is very close to saturation.");
        suggestions.push("Consider providing vapor quality.");
      }
    } catch {}
  }

  /* ============================================================
     Independent variable count
     ============================================================ */

  const defined = Object.entries({ T, P, h, s, v, x })
    .filter(([, val]) => Number.isFinite(val))
    .map(([k]) => k);

  if (defined.length < 2) {
    errors.push("At least two independent properties are required.");
  }

  if (defined.length > 2 && !defined.includes("x")) {
    warnings.push("System may be over-specified.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}
