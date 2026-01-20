// if97.js
// IF97 T–P property evaluator (PURE DISPATCHER)

import {
  T_R1_MAX,
  T_R5_MIN,
  P_R5_MAX
} from "../constants.js";

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region3 } from "./region3.js";
import { region5 } from "./region5.js";
import { Psat } from "./region4.js";

import { viscosity } from "./viscosity.js";
import { conductivity } from "./conductivity.js";

export function computeIF97(T, P) {
  let state;

  /* ------------------------------------------------------------
     Region selection
     ------------------------------------------------------------ */

  if (T >= T_R5_MIN && P <= P_R5_MAX) {
    state = region5(T, P);
  }
  else if (T <= T_R1_MAX) {
    const Ps = Psat(T);

    if (Math.abs(P - Ps) / Ps < 1e-7) {
      return {
        region: 4,
        phase: "two_phase",
        T,
        P,
        message: "Two-phase state: specify quality x"
      };
    }

    state = P > Ps ? region1(T, P) : region2(T, P);
  }
  else {
    state = P <= 16.5292 ? region2(T, P) : region3(T, P);
  }

  state.T = T;
  state.P = P;

  /* ------------------------------------------------------------
     Transport properties (single-phase only)
     ------------------------------------------------------------ */

  if (
    state.phase !== "two_phase" &&
    Number.isFinite(state.density) &&
    state.density > 0
  ) {
    state.viscosity = viscosity(T, state.density);
    state.conductivity = conductivity(T, state.density);
  } else {
    state.viscosity = NaN;
    state.conductivity = NaN;
  }

  return state;
}
