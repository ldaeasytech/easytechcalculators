// solver.js
// Hybrid IF97 + IAPWS-95 master solver (with quality support)

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
  const rho_cgs = rho * 1e-3;
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

function saturatedMixture(T, P, x) {
  const sat = region4(T);

  return {
    phase: "two_phase",
    phaseLabel: "saturated mixture",
    mixture: true,
    quality: x,
    T,
    P,
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
   Core TP solver
   ============================================================ */

function solveTP(T, P) {
  const Ps = Psat(T);
  const Ts = Tsat(P);

  if (Math.abs(P - Ps) < SAT_EPS) {
    return saturatedMixture(T, Ps, null);
  }

  if (T < Ts && P > Ps) {
    const r = region1(T, P);
    r.phaseLabel = "compressed liquid";
    attachTransport(r, T, r.density);
    return finalize("subcooled_liquid", r, T, P);
  }

  let rho0 = T > Ts
    ? (P * 1e3) / (0.461526 * T)
    : region1(T, P).density;

  let rho;
  try {
    rho = solveDensity(T, P, rho0);
  } catch {
    return saturatedMixture(T, Psat(T), null);
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
    return solveTP(T, Psat(T));
  }

  /* ---------------- Tx ---------------- */
  if (mode === "Tx") {
    const P = inputs.pressure;
    return solveTP(Tsat(P), P);
  }

  /* ---------------- Ph ---------------- */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;
    const T = Tsat(P);

    const sat = region4(T);
    const hf = sat.liquid.h;
    const hg = sat.vapor.h;

    if (h > hf && h < hg) {
      const x = (h - hf) / (hg - hf);
      return saturatedMixture(T, P, x);
    }

    return solveTP(
      h <= hf ? T - 1e-3 : T + 1e-3,
      P
    );
  }

  /* ---------------- Ps ---------------- */
  if (mode === "Ps") {
    const P = inputs.pressure;
    const s = inputs.entropy;
    const T = Tsat(P);

    const sat = region4(T);
    const sf = sat.liquid.s;
    const sg = sat.vapor.s;

    if (s > sf && s < sg) {
      const x = (s - sf) / (sg - sf);
      return saturatedMixture(T, P, x);
    }

    return solveTP(
      s <= sf ? T - 1e-3 : T + 1e-3,
      P
    );
  }

  throw new Error(`Unsupported mode: ${mode}`);
}
