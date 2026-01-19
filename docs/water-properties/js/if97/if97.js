// if97/if97.js
// IF97 T–P property evaluator (PURE DISPATCHER)
//
// INTERNAL UNITS:
//   T → K
//   P → MPa
//   h → kJ/kg
//   s → kJ/(kg·K)
//
// RESPONSIBILITY:
//   - Select correct IF97 region for (T, P)
//   - Compute thermodynamic + transport properties
//   - NO inverse solving
//   - NO UI logic
//   - NO diagnostics

import {
  T_R1_MAX,
  T_R5_MIN,
  P_R5_MAX,
  EPS
} from "../constants.js";

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region3 } from "./region3.js";
import { region5 } from "./region5.js";
import { Psat } from "./region4.js";

import { viscosity } from "./viscosity.js";
import { conductivity } from "./conductivity.js";

/* ============================================================
   Compute properties from (T, P)
   ============================================================ */

export function computeIF97(T, P) {
  let state;

  /* ------------------------------------------------------------
     Region selection (explicit, solver-safe)
  ------------------------------------------------------------ */

  // Region 5: high-temperature steam
  if (T >= T_R5_MIN && P <= P_R5_MAX) {
    state = region5(T, P);
  }

  // Regions 1 & 2 (below 623.15 K)
  else if (T <= T_R1_MAX) {
    const Ps = Psat(T);

    // Exactly on saturation line → undefined without quality
    if (Math.abs(P - Ps) / Ps < 1e-7) {
      return {
        region: 4,
        phase: "two_phase",
        T,
        P,
        message: "Two-phase state: specify quality x"
      };
    }

    // Compressed / subcooled liquid
    if (P > Ps) {
      state = region1(T, P);
    }
    // Vapor
    else {
      state = region2(T, P);
    }
  }

  // Region 2 or 3 above 623.15 K
  else {
    // Region 2 (superheated)
    if (P <= 16.5292) {
      state = region2(T, P);
    }
    // Region 3 (dense fluid)
    else {
      state = region3(T, P);
    }
  }

  /* ------------------------------------------------------------
     Attach state variables
  ------------------------------------------------------------ */

  state.T = T;
  state.P = P;

  /* ------------------------------------------------------------
     Transport properties (engineering-safe)
  ------------------------------------------------------------ */

  if (
    Number.isFinite(state.density) &&
    state.density > 0 &&
    Number.isFinite(state.cp) &&
    state.cp > 0
  ) {
    state.viscosity = viscosity(T, state.density);
    state.conductivity = conductivity(
      T,
      state.density,
      state.cp,
      state.viscosity
    );
  } else {
    state.viscosity = NaN;
    state.conductivity = NaN;
  }

  return state;
}
