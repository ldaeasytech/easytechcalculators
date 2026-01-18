// quality.js
// Vapor quality computation (IF97-coherent)
// INTERNAL UNITS:
//   T → K
//   P → MPa
//   h → kJ/kg
//   s → kJ/(kg·K)
//   v → m3/kg

import { computeIF97 } from "./if97/if97.js";
import { Psat } from "./if97/region4.js";

const EPS = 1e-6;

/**
 * Compute vapor quality x on the saturation line.
 *
 * Required inputs:
 *  - T or P
 *  - one of: enthalpy (h), entropy (s), specificVolume (v)
 */
export function computeQuality({ T, P, enthalpy, entropy, specificVolume }) {
  // --- Determine saturation state ---
  if (T === undefined && P === undefined) {
    throw new Error("Quality computation requires T or P.");
  }

  let Ts, Ps;

  if (T !== undefined) {
    Ps = Psat(T);
    Ts = T;
  } else {
    // P provided
    Ps = P;
    // No inverse Tsat(P) needed — solver already enforces consistency
    throw new Error("Quality computation with P only is ambiguous. Provide T.");
  }

  // --- Get saturated liquid and vapor states ---
  const satL = computeIF97(Ts, Ps * (1 + EPS));
  const satV = computeIF97(Ts, Ps * (1 - EPS));

  let x;

  if (enthalpy !== undefined) {
    x = (enthalpy - satL.enthalpy) /
        (satV.enthalpy - satL.enthalpy);
  } else if (entropy !== undefined) {
    x = (entropy - satL.entropy) /
        (satV.entropy - satL.entropy);
  } else if (specificVolume !== undefined) {
    x = (specificVolume - satL.specificVolume) /
        (satV.specificVolume - satL.specificVolume);
  } else {
    throw new Error(
      "Quality computation requires enthalpy, entropy, or specific volume."
    );
  }

  return clamp(x);
}

/* ============================================================
   Utilities
   ============================================================ */

function clamp(x) {
  if (!isFinite(x)) return NaN;
  return Math.max(0, Math.min(1, x));
}
