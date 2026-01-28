// solver.js
// Hybrid IF97 + IAPWS-95 master solver (extended)

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

function attachTransport(r, T, rho) {
  const rho_cgs = rho * 1e-3; // kg/m³ → g/cm³
  r.viscosity = viscosity(T, rho_cgs);
  r.thermalConductivity = conductivity(T, rho_cgs);
  return r;
}

function finalize(phase, r, T, P) {
  return {
    phase,
    phaseLabel: r.phaseLabel,
    T,
    P,
    density: r.density,
    specificVolume: 1 / r.density,
    enthalpy: r.h,
    entropy: r.s,
    Cv: r.cv,
    Cp: r.cp,
    thermalConductivity: r.thermalConductivity,
    viscosity: r.viscosity
  };
}

function saturatedState(T, P) {
  const sat = region4(T);
  return {
    liquid: finalize(
      "saturated_liquid",
      { ...sat.liquid, phaseLabel: "saturated liquid" },
      T,
      P
    ),
    vapor: finalize(
      "saturated_vapor",
      { ...sat.vapor, phaseLabel: "saturated vapor" },
      T,
      P
    )
  };
}

/* ============================================================
   Core TP solver (used by all modes)
   ============================================================ */

function solveTP(T, P) {
  const Ps = Psat(T);
  const Ts = Tsat(P);

  /* ---------- Saturation ---------- */
  if (Math.abs(P - Ps) < SAT_EPS) {
    return saturatedState(T, Ps);
  }

  /* ---------- Compressed liquid ---------- */
  if (T < Ts && P > Ps) {
    const r = region1(T, P);
    r.phaseLabel = "compressed liquid";
    attachTransport(r, T, r.density);
    return finalize("subcooled_liquid", r, T, P);
  }

  /* ---------- Initial density guess ---------- */
  let rho0;
  if (T > Ts) {
    rho0 = (P * 1e3) / (0.461526 * T); // ideal gas
  } else {
    rho0 = region1(T, P).density;
  }

  /* ---------- IAPWS-95 solve ---------- */
  let rho;
  try {
    rho = solveDensity(T, P, rho0);
  } catch {
    const r = region4(T);
    return saturatedState(T, Psat(T));
  }

  const r = iapwsProps(T, rho);
  attachTransport(r, T, rho);

  r.phaseLabel = T > Ts
    ? "superheated steam"
    : "compressed liquid";

  return finalize("single_phase", r, T, P);
}

/* ============================================================
   Public solver
   ============================================================ */

export function solve({ mode, ...inputs }) {

  /* ---------------- TP ---------------- */
  if (mode === "TP") {
    return solveTP(inputs.temperature, inputs.pressure);
  }

  /* ---------------- Px ---------------- */
  if (mode === "Px") {
    const T = inputs.temperature;
    const P = Psat(T);
    return solveTP(T, P);
  }

  /* ---------------- Tx ---------------- */
  if (mode === "Tx") {
    const P = inputs.pressure;
    const T = Tsat(P);
    return solveTP(T, P);
  }

  /* ---------------- Ph ---------------- */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const Ts = Tsat(P);
    const r1 = region1(Ts, P);
    const r2 = region2(Ts, P);

    if (h < r1.h) {
      return solveTP(Ts - 1e-3, P);
    }
    if (h > r2.h) {
      return solveTP(Ts + 1e-3, P);
    }

    // Saturated mixture → return both
    return saturatedState(Ts, P);
  }

  /* ---------------- Ps ---------------- */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;

    const Ts = Tsat(P);
    const r1 = region1(Ts, P);
    const r2 = region2(Ts, P);

    if (s < r1.s) {
      return solveTP(Ts - 1e-3, P);
    }
    if (s > r2.s) {
      return solveTP(Ts + 1e-3, P);
    }

    return saturatedState(Ts, P);
  }

  throw new Error(`Unsupported mode: ${mode}`);
}
