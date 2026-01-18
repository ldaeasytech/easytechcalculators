// if97/if97.js
// Core IF97 dispatcher + transport properties integration
// INTERNAL UNITS:
//   T → K
//   P → MPa

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region3 } from "./region3.js";
import { region5 } from "./region5.js";
import { Psat } from "./region4.js";

import { viscosity } from "./viscosity.js";
import { conductivity } from "./conductivity.js";
import { RHO_MIN } from "./constants.js";

// IF97 boundaries
const T23 = 623.15;      // K
const P23 = 16.5292;    // MPa (Region 2–3 boundary)
const T5  = 1073.15;    // K
const PMAX = 100.0;     // MPa
const EPS = 1e-7;

/**
 * Compute thermodynamic + transport properties using IF97
 * @param {number} T - Temperature [K]
 * @param {number} P - Pressure [MPa]
 * @returns {object} state
 */
export function computeIF97(T, P) {
  let state;

  /* ============================================================
     Region 5: very high temperature steam
     ============================================================ */
  if (T >= T5) {
    if (P > PMAX) {
      throw new Error("Pressure exceeds IF97 Region 5 limits.");
    }
    state = region5(T, P);
  }

  /* ============================================================
     Region 1 / 2 / 4: T ≤ 623.15 K
     ============================================================ */
  else if (T <= T23) {
    const Ps = Psat(T);

    // Saturation line: do NOT evaluate transport here
    if (Math.abs(P - Ps) < EPS) {
      return {
        region: 4,
        phase: "two-phase",
        T,
        P,
        message: "Two-phase state: specify quality x"
      };
    }

    // Compressed / subcooled liquid
    if (P > Ps) {
      state = region1(T, P);
    }
    // Superheated vapor
    else {
      state = region2(T, P);
    }
  }

  /* ============================================================
     Region 2 / 3: 623.15 K < T < 1073.15 K
     ============================================================ */
  else {
    if (P <= P23) {
      state = region2(T, P);
    } else {
      state = region3(T, P);
    }
  }

  /* ============================================================
     Sanity guards (prevents transport blow-up)
     ============================================================ */

  if (!isFinite(state.density) || state.density <= RHO_MIN) {
    throw new Error("Invalid density computed in IF97 core.");
  }

  if (!isFinite(state.cp) || state.cp <= 0) {
    throw new Error("Invalid Cp computed in IF97 core.");
  }

  /* ============================================================
     Transport properties (IAPWS)
     ============================================================ */

  // Dynamic viscosity [Pa·s]
  state.viscosity = viscosity(T, state.density);

  // Thermal conductivity [W/(m·K)]
  // cp from IF97 is kJ/(kg·K) → convert to J/(kg·K)
  state.thermalConductivity = conductivity(
    T,
    state.density,
    state.cp * 1000,
    state.viscosity
  );

  return state;
}
