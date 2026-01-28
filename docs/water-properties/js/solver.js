// solver.js
// Hybrid IF97 + IAPWS-95 master solver

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region4, Psat, Tsat } from "./region4.js";

import { solveDensity } from "./iapws95/solver.js";
import { properties as iapwsProps } from "./iapws95/properties.js";

import { conductivity } from "./conductivity.js";
import { viscosity } from "./viscosity.js";

const SAT_EPS = 1e-6;

/* ============================================================
   Helper
   ============================================================ */

function withPhase(phase, r, T, P) {
  return {
    phase,
    phaseLabel: r.phaseLabel ?? phase,
    T,
    P,
    ...r
  };
}

/* ============================================================
   Main solver
   ============================================================ */

export function solve({ mode, ...inputs }) {

  /* ------------------ T–P ------------------ */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;

    const Ps = Psat(T);
    const Ts = Tsat(P);

    /* ----- Saturation ----- */
    if (Math.abs(P - Ps) < SAT_EPS) {
      const r = region4(T);
      return withPhase("saturated", r, T, Ps);
    }

    /* ----- Compressed liquid ----- */
    if (T < Ts && P > Ps) {
      const r = region1(T, P);
      return withPhase("compressed_liquid", r, T, P);
    }

    /* ----- Initial density guess (CRITICAL) ----- */
    let rho0;

    if (T > Ts) {
      // Ideal-gas density (vapor root selector)
      rho0 = (P * 1e3) / (0.461526 * T);
    } else {
      rho0 = region1(T, P).density;
    }

    if (!Number.isFinite(rho0) || rho0 <= 0) {
      throw new Error("Invalid initial density guess");
    }

    /* ----- IAPWS-95 density solve ----- */
    const rho = solveDensity(T, P, rho0);

    /* ----- Root consistency check ----- */
    if (T > Ts && rho > 322.0) {
      throw new Error("Liquid root detected in vapor region");
    }

    /* ----- Final properties ----- */
    const r = iapwsProps(T, rho);

    // Transport properties (IAPWS expects rho in g/cm^3)
    const rho_cgs = rho * 1e-3;
    r.viscosity = viscosity(T, rho_cgs);
    r.thermalConductivity = conductivity(T, rho_cgs);

    r.phaseLabel =
      T > Ts ? "superheated vapor" : "compressed liquid";

    return withPhase("single_phase", r, T, P);
  }

  /* ----------------------------------------------------------
     Other modes (unchanged — IF97)
     ---------------------------------------------------------- */

  throw new Error(`Unsupported mode: ${mode}`);
}
