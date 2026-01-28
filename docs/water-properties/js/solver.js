// solver.js
// Hybrid IF97 + IAPWS-95 master solver

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region4, Psat, Tsat } from "./if97/region4.js";

import { solveDensity } from "./iapws95/solver.js";
import { properties as iapwsProps } from "./iapws95/properties.js";

import { conductivity } from "./if97/conductivity.js";
import { viscosity } from "./if97/viscosity.js";

const SAT_EPS = 1e-6;
const R = 0.461526;

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
   Core TP solver (REUSED BY ALL MODES)
   ============================================================ */

function solveTP(T, P) {
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

  /* ----- Initial density guess ----- */
  let rho0;

  if (T > Ts) {
    // Ideal gas guess for vapor
    rho0 = (P * 1e3) / (R * T);
  } else {
    rho0 = region1(T, P).density;
  }

  if (!Number.isFinite(rho0) || rho0 <= 0) {
    throw new Error("Invalid initial density guess");
  }

  /* ----- IAPWS-95 density solve ----- */
  let rho;
  try {
    rho = solveDensity(T, P, rho0);
  } catch {
    // fallback using saturation-based guess
    const sat = region4(T);
    rho = T > Ts ? sat.rho_g : sat.rho_f;
  }

  /* ----- Root consistency ----- */
  if (T > Ts && rho > 322.0) {
    throw new Error("Liquid root detected in vapor region");
  }

  /* ----- Final properties ----- */
  const r = iapwsProps(T, rho);

  const rho_cgs = rho * 1e-3;
  r.viscosity = viscosity(T, rho_cgs);
  r.thermalConductivity = conductivity(T, rho_cgs);

  r.phaseLabel =
    T > Ts ? "superheated vapor" : "compressed liquid";

  return withPhase("single_phase", r, T, P);
}

/* ============================================================
   Main solver
   ============================================================ */

export function solve({ mode, ...inputs }) {

  /* ------------------ T–P ------------------ */
  if (mode === "TP") {
    return solveTP(inputs.temperature, inputs.pressure);
  }

  /* ------------------ T–x ------------------ */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;

    const r = region4(T);
    return withPhase("saturated", r, T, r.P);
  }

  /* ------------------ P–x ------------------ */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;

    const T = Tsat(P);
    const r = region4(T);
    return withPhase("saturated", r, T, P);
  }

  /* ------------------ P–h ------------------ */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    // IF97 temperature iteration
    let T = Tsat(P);
    for (let i = 0; i < 30; i++) {
      let r;
      try {
        r = region2(T, P);
      } catch {
        r = region1(T, P);
      }
      const dh = r.enthalpy - h;
      if (Math.abs(dh) < 1e-6) break;
      T -= dh / 2000; // damping
    }

    return solveTP(T, P);
  }

  /* ------------------ P–s ------------------ */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;

    let T = Tsat(P);
    for (let i = 0; i < 30; i++) {
      let r;
      try {
        r = region2(T, P);
      } catch {
        r = region1(T, P);
      }
      const ds = r.entropy - s;
      if (Math.abs(ds) < 1e-6) break;
      T -= ds / 5; // damping
    }

    return solveTP(T, P);
  }

  throw new Error(`Unsupported mode: ${mode}`);
}
