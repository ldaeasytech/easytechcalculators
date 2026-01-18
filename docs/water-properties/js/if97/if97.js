// if97/if97.js
// Core IF97 dispatcher + transport properties integration
// T [K], P [MPa]

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region3 } from "./region3.js";
import { region5 } from "./region5.js";
import { Psat } from "./region4.js";

import { viscosity } from "./viscosity.js";
import { conductivity } from "./conductivity.js";

// IF97 boundaries
const T23 = 623.15;      // K
const P23 = 16.529;      // MPa
const T5  = 1073.15;     // K
const EPS = 1e-6;

/**
 * Compute thermodynamic + transport properties using IF97
 * @param {number} T - Temperature [K]
 * @param {number} P - Pressure [MPa]
 * @returns {object} state
 */
export function computeIF97(T, P) {
  let state;

  /* ---------- Region selection ---------- */

  // Region 5: high-temperature steam
  if (T >= T5) {
    state = region5(T, P);
  }

  // Below Region 3 boundary
  else if (T < T23) {
    const Ps = Psat(T);

    // Two-phase (Region 4)
    if (Math.abs(P - Ps) < EPS) {
      return {
        region: 4,
        phase: "two-phase",
        T,
        P,
        message: "Two-phase state: specify quality x"
      };
    }

    state = (P > Ps)
      ? region1(T, P)
      : region2(T, P);
  }

  // Above Region 3 boundary
  else {
    state = (P > P23)
      ? region3(T, P)
      : region2(T, P);
  }

  /* ---------- Transport properties (REFPROP-level) ---------- */

  // Dynamic viscosity [Pa·s]
  state.viscosity = viscosity(T, state.density);

  // Thermal conductivity [W/(m·K)]
  // cp must be in J/(kg·K) → IF97 gives kJ/(kg·K)
  state.thermalConductivity = conductivity(
    T,
    state.density,
    state.cp * 1000,
    state.viscosity
  );

  return state;
}
