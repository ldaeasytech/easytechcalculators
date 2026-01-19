// if97/if97.js
// Core IF97 dispatcher with diagnostic-safe density handling
// INTERNAL UNITS:
//   T → K
//   P → MPa
//   h → kJ/kg
//   s → kJ/(kg·K)

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region3 } from "./region3.js";
import { region5 } from "./region5.js";
import { Psat } from "./region4.js";

import { viscosity } from "./viscosity.js";
import { conductivity } from "./conductivity.js";
import { RHO_MIN, RHO_MAX } from "./constants.js";

// IF97 boundaries
const T23 = 623.15;      // K
const P23 = 16.5292;    // MPa
const T5  = 1073.15;    // K
const PMAX = 100.0;     // MPa
const EPS = 1e-7;

/* ============================================================
   MAIN IF97 SOLVER
   ============================================================ */

export function computeIF97(T, P) {
  let state;

  /* ------------------------------------------------------------
     REGION SELECTION (STRICT IF97)
  ------------------------------------------------------------ */

  if (T >= T5) {
    state = region5(T, P);
  }

  else if (T <= T23) {
    const Ps = Psat(T);

    // Two-phase boundary (do not compute properties here)
    if (Math.abs(P - Ps) < EPS) {
      return {
        region: 4,
        phase: "two-phase",
        T,
        P,
        message: "Two-phase state: specify quality x"
      };
    }

    // Liquid
    if (P > Ps) {
      state = region1(T, P);
    }
    // Vapor
    else {
      state = region2(T, P);
    }
  }

  else {
    if (P <= P23) {
      state = region2(T, P);
    } else {
      state = region3(T, P);
    }
  }

  /* ------------------------------------------------------------
     DIAGNOSTIC DENSITY HANDLING (NO THROW)
  ------------------------------------------------------------ */

  let densityFlag = "ok";

  if (!isFinite(state.density)) {
    densityFlag = "nan";
  } else if (state.density <= 0) {
    densityFlag = "negative";
  } else if (state.density < RHO_MIN) {
    densityFlag = "too-small";
  } else if (state.density > RHO_MAX) {
    densityFlag = "too-large";
  }

  // Attach diagnostics (always returned)
  state._diagnostics = {
    densityFlag,
    rawDensity: state.density
  };

  /* ------------------------------------------------------------
     TRANSPORT PROPERTIES (SAFE MODE)
     Only compute if density & Cp are physically usable
  ------------------------------------------------------------ */

  if (
    densityFlag === "ok" &&
    isFinite(state.cp) &&
    state.cp > 0
  ) {
    // Dynamic viscosity [Pa·s]
    state.viscosity = viscosity(T, state.density);

    // Thermal conductivity [W/(m·K)]
    state.thermalConductivity = conductivity(
      T,
      state.density,
      state.cp * 1000,   // kJ → J
      state.viscosity
    );
  } else {
    // Skip transport if state is not physically valid
    state.viscosity = NaN;
    state.thermalConductivity = NaN;
    state._diagnostics.transportSkipped = true;
  }

  return state;
}
