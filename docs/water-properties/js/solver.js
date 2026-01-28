// solver.js
// Hybrid IF97 + IAPWS-95 solver
// Region 4 uses piecewise saturation correlations

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region4, Psat, Tsat } from "./if97/region4.js";

import { solveDensity } from "./iapws95/solver.js";
import { properties as iapwsProps } from "./iapws95/properties.js";

import { conductivity } from "./if97/conductivity.js";
import { viscosity } from "./if97/viscosity.js";

const SAT_EPS = 1e-6;

/* ============================================================
   Helpers
   ============================================================ */

function finalizeSinglePhase(r, T, P) {
  return {
    phase: "single_phase",
    phaseLabel: r.phaseLabel,
    T,
    P,
    density: r.density,
    specificVolume: 1 / r.density,
    enthalpy: r.h,
    entropy: r.s,
    Cp: r.cp,
    Cv: r.cv,
    thermalConductivity: r.thermalConductivity,
    viscosity: r.viscosity
  };
}

function saturatedMixture(T, x = null) {
  const sat = region4(T);

  return {
    phase: "two_phase",
    phaseLabel: "saturated mixture",
    mixture: true,
    quality: x,
    T: sat.T,
    P: sat.P,

    liquid: {
      phase: "saturated_liquid",
      phaseLabel: "saturated liquid",
      density: sat.rho_f,
      specificVolume: sat.v_f,
      enthalpy: sat.h_f,
      entropy: sat.s_f,
      Cp: sat.cp_f,
      Cv: sat.cv_f,
      thermalConductivity: sat.k_f,
      viscosity: sat.mu_f
    },

    vapor: {
      phase: "saturated_vapor",
      phaseLabel: "saturated vapor",
      density: sat.rho_g,
      specificVolume: sat.v_g,
      enthalpy: sat.h_g,
      entropy: sat.s_g,
      Cp: sat.cp_g,
      Cv: sat.cv_g,
      thermalConductivity: sat.k_g,
      viscosity: sat.mu_g
    }
  };
}

/* ============================================================
   Core TP solver
   ============================================================ */

function solveTP(T, P) {
  const Ps = Psat(T);
  const Ts = Tsat(P);

  /* ---------- Saturation ---------- */
  if (Math.abs(P - Ps) < SAT_EPS) {
    return saturatedMixture(T);
  }

  /* ---------- Subcooled / compressed ---------- */
  if (T < Ts && P > Ps) {
    const r = region1(T, P);
    r.phaseLabel = "compressed liquid";

    r.viscosity = viscosity(T, r.density * 1e-3);
    r.thermalConductivity = conductivity(T, r.density * 1e-3);

    return finalizeSinglePhase(r, T, P);
  }

  /* ---------- Superheated / dense vapor ---------- */
  let rho0 =
    T > Ts
      ? (P * 1e3) / (0.461526 * T)   // ideal-gas guess
      : region1(T, P).density;

  let rho;
  try {
    rho = solveDensity(T, P, rho0);
  } catch {
    return saturatedMixture(T);
  }

  const r = iapwsProps(T, rho);

  r.viscosity = viscosity(T, rho * 1e-3);
  r.thermalConductivity = conductivity(T, rho * 1e-3);

  r.phaseLabel =
    T > Ts ? "superheated steam" : "compressed liquid";

  return finalizeSinglePhase(r, T, P);
}

/* ============================================================
   Public solver
   ============================================================ */

export function solve({ mode, ...inputs }) {

  /* ---------------- TP ---------------- */
  if (mode === "TP") {
    return solveTP(inputs.temperature, inputs.pressure);
  }

  /* ---------------- Tx ---------------- */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    return saturatedMixture(T, x);
  }

  /* ---------------- Px ---------------- */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    return saturatedMixture(Tsat(P), x);
  }

  /* ---------------- Ph ---------------- */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;
    const T = Tsat(P);

    const sat = region4(T);

    if (h > sat.h_f && h < sat.h_g) {
      const x = (h - sat.h_f) / (sat.h_g - sat.h_f);
      return saturatedMixture(T, x);
    }

    return solveTP(
      h <= sat.h_f ? T - 1e-3 : T + 1e-3,
      P
    );
  }

  /* ---------------- Ps ---------------- */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;
    const T = Tsat(P);

    const sat = region4(T);

    if (s > sat.s_f && s < sat.s_g) {
      const x = (s - sat.s_f) / (sat.s_g - sat.s_f);
      return saturatedMixture(T, x);
    }

    return solveTP(
      s <= sat.s_f ? T - 1e-3 : T + 1e-3,
      P
    );
  }

  throw new Error(`Unsupported mode: ${mode}`);
}
