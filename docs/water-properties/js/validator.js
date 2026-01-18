// validator.js
// Input validation and state consistency checks
// INTERNAL UNITS:
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   s  → kJ/(kg·K)
//   v  → m3/kg
//   x  → quality [0–1]

import { Tc, Pc, Tt } from "./if97/constants.js";
import { Psat } from "./if97/region4.js";

export function validateState(inputs) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  const fixes = [];

  const { T, P, h, s, v, x } = inputs;

  /* ============================================================
     Basic range checks
     ============================================================ */

  if (T !== undefined) {
    if (T < Tt || T > 2273.15) {
      errors.push("Temperature is outside the valid IF97 range.");
      suggestions.push("Use 273.16 K ≤ T ≤ 2273.15 K.");
    }
  }

  if (P !== undefined) {
    if (P <= 0 || P > 100) {
      errors.push("Pressure is outside the valid IF97 range.");
      suggestions.push("Use 0 < P ≤ 100 MPa.");
    }
  }

  if (x !== undefined) {
    if (x < 0 || x > 1) {
      errors.push("Quality must be between 0 and 1.");
      suggestions.push("Use 0 ≤ x ≤ 1.");
    }
  }

  if (v !== undefined && v <= 0) {
    errors.push("Specific volume must be positive.");
  }

  /* ============================================================
     Two-phase logic (NO property computation)
     ============================================================ */

  if (x !== undefined) {
    if (T === undefined && P === undefined) {
      errors.push("Quality requires either temperature or pressure.");
      suggestions.push("Provide T or P together with quality.");
    }
  }

  if (T !== undefined && P !== undefined) {
    const Ps = Psat(T);

    if (Math.abs(P - Ps) / Ps < 1e-4) {
      warnings.push(
        "State lies on the saturation line. Two-phase behavior possible."
      );
      suggestions.push("Provide quality x to fully define the state.");
    }
  }

  /* ============================================================
     Property sanity checks (order-of-magnitude only)
     ============================================================ */

  if (h !== undefined) {
    if (h < -1000 || h > 6000) {
      warnings.push("Enthalpy is outside typical physical bounds.");
      suggestions.push("Verify enthalpy value and units (kJ/kg).");
    }
  }

  if (s !== undefined) {
    if (s < 0 || s > 15) {
      warnings.push("Entropy is outside typical physical bounds.");
      suggestions.push("Verify entropy value and units (kJ/kg·K).");
    }
  }

  /* ============================================================
     Over-specified / ambiguous input detection
     ============================================================ */

  const defined = Object.entries({ T, P, h, s, v, x })
    .filter(([, val]) => val !== undefined)
    .map(([key]) => key);

  if (defined.length < 2) {
    errors.push("At least two independent properties are required.");
  }

  if (defined.length > 2 && x === undefined) {
    warnings.push(
      "More than two properties specified. System may be over-specified."
    );
    suggestions.push("Remove redundant inputs.");
  }

  if (defined.includes("x") && defined.length > 2) {
    warnings.push(
      "Quality already defines the two-phase state. Extra properties may conflict."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    fixes
  };
}
