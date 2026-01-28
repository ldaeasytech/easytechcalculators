// solver.js — IF97 + IAPWS-95 Hybrid Thermodynamics Solver
// Folder: /docs/water-properties/js/solver.js

/* ============================================================
   Imports (MATCHES YOUR FILE STRUCTURE)
   ============================================================ */

// IF97 regions (used ONLY for initial guesses & non-TP modes)
import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region5 } from "./if97/region5.js";

// Region 4 (AUTHORITATIVE for saturation & phase detection)
import {
  Psat,
  Tsat,

  rho_f_sat,
  v_f_sat,
  h_f_sat,
  s_f_sat,
  cp_f_sat,
  cv_f_sat,

  rho_g_sat,
  v_g_sat,
  h_g_sat,
  s_g_sat,
  cp_g_sat,
  cv_g_sat
} from "./if97/region4.js";

// Transport properties (IAPWS correlations)
import { conductivity } from "./if97/conductivity.js";
import { viscosity } from "./if97/viscosity.js";

// IAPWS-95 single-phase solver
import { solveDensity } from "./iapws95/solver.js";
import { properties as iapwsProps } from "./iapws95/properties.js";

/* ============================================================
   Constants
   ============================================================ */

const SAT_EPS = 1e-6;
const X_EPS = 1e-10;

const MAX_IT = 200;
const T_TOL = 1e-7;
const P_TOL = 1e-10;

const SAT_T_BAND_PH = 2e-4; // K
const SAT_P_BAND_TS = 5e-5; // MPa

function isRegion5(T, P) {
  return T > 1073.15 && T <= 2273.15 && P <= 50.0;
}

/* ============================================================
   Main Solver
   ============================================================ */

export function solve(inputs) {
  let { mode } = inputs;

  // UI alias: P–s → Ts
  if (mode === "Ps") mode = "Ts";

  /* ------------------ T–P ------------------ */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;
    const Ps = Psat(T);

    /* ----- Saturation (Region 4 is authoritative) ----- */
    if (Math.abs(P - Ps) < SAT_EPS) {
      return withPhase("Saturated vapor", satVaporState(T), T, Ps);
    }

    /* ----- Initial density guess (IF97 → fallback to sat) ----- */
    let rho0;

    try {
      let guess;
      if (P > Ps) {
        guess = region1(T, P);
      } else if (isRegion5(T, P)) {
        guess = region5(T, P);
      } else {
        guess = region2(T, P);
      }

      rho0 = guess.density;
      if (!Number.isFinite(rho0) || rho0 <= 0) {
        throw new Error("Invalid IF97 density");
      }
    } catch {
      // Guaranteed physical fallback
      rho0 = (P > Ps) ? rho_f_sat(T) : rho_g_sat(T);
    }

   /* ----- Decide liquid vs vapor before IAPWS-95 ----- */
if (P > Ps && T < Tsat(P)) {
  // Compressed liquid → IF97 Region 1 is robust here
  const r = region1(T, P);
  return withPhase("compressed_liquid", r, T, P);
}

/* ----- IAPWS-95 Newton solver (vapor / supercritical) ----- */
let rho;
try {
  rho = solveDensity(T, P, rho0);
} catch {
  rho = solveDensity(T, P, Math.max(0.5 * rho0, 1e-3));
}

const r = iapwsProps(T, rho);
return withPhase("Single-phase", r, T, P);


  /* ------------------ T–x ------------------ */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;
    const P = Psat(T);

    if (x <= X_EPS) return withPhase("Saturated liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("Saturated vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  /* ------------------ P–x ------------------ */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;
    const T = Tsat(P);

    if (x <= X_EPS) return withPhase("Saturated liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("Saturated vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  /* ------------------ P–h ------------------ */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const T_sat = Tsat(P);
    const hf = h_f_sat(T_sat);
    const hg = h_g_sat(T_sat);

    if (h >= hf && h <= hg) {
      const x = clamp01((h - hf) / (hg - hf));
      if (x <= X_EPS) return withPhase("Saturated liquid", satLiquidState(T_sat), T_sat, P);
      if (1 - x <= X_EPS) return withPhase("Saturated vapor", satVaporState(T_sat), T_sat, P);
      return mixStates(satLiquidState(T_sat), satVaporState(T_sat), x, T_sat, P);
    }

    if (h < hf) {
      const Tsol = solveT(P, h, T => region1(T, P).enthalpy);
      return withPhase("Compressed liquid", region1(Tsol, P), Tsol, P);
    }

    const Tsol = solveT(P, h, T =>
      isRegion5(T, P) ? region5(T, P).enthalpy : region2(T, P).enthalpy
    );

    if (isRegion5(Tsol, P)) {
      return withPhase("High-temperature steam", region5(Tsol, P), Tsol, P);
    }

    return withPhase("Superheated vapor", region2(Tsol, P), Tsol, P);
  }

  /* ------------------ T–s (Ps UI mode) ------------------ */
  if (mode === "Ts") {
    const T = inputs.temperature;
    const s = inputs.entropy;

    const Ps = Psat(T);
    const sf = s_f_sat(T);
    const sg = s_g_sat(T);

    if (s >= sf && s <= sg) {
      const x = clamp01((s - sf) / (sg - sf));
      if (x <= X_EPS) return withPhase("Saturated liquid", satLiquidState(T), T, Ps);
      if (1 - x <= X_EPS) return withPhase("Saturated vapor", satVaporState(T), T, Ps);
      return mixStates(satLiquidState(T), satVaporState(T), x, T, Ps);
    }

    const Psol = solveP(T, s, P => {
      if (Math.abs(P - Ps) < SAT_EPS) return sg;
      if (P > Ps) return region1(T, P).entropy;
      return isRegion5(T, P) ? region5(T, P).entropy : region2(T, P).entropy;
    });

    if (Psol > Ps) return withPhase("Compressed liquid", region1(T, Psol), T, Psol);
    if (isRegion5(T, Psol)) return withPhase("High-temperature steam", region5(T, Psol), T, Psol);

    return withPhase("Superheated vapor", region2(T, Psol), T, Psol);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   Saturation helpers
   ============================================================ */

function satLiquidState(T) {
  return {
    density: rho_f_sat(T),
    specificVolume: v_f_sat(T),
    enthalpy: h_f_sat(T),
    entropy: s_f_sat(T),
    cp: cp_f_sat(T),
    cv: cv_f_sat(T)
  };
}

function satVaporState(T) {
  return {
    density: rho_g_sat(T),
    specificVolume: v_g_sat(T),
    enthalpy: h_g_sat(T),
    entropy: s_g_sat(T),
    cp: cp_g_sat(T),
    cv: cv_g_sat(T)
  };
}

/* ============================================================
   Output helpers (UI-compatible)
   ============================================================ */

function withPhase(phase, r, T, P) {
  const out = {
    phase,
    phaseLabel: phase,
    T,
    P,
    density: r.density,
    specificVolume: r.specificVolume,
    enthalpy: r.enthalpy,
    entropy: r.entropy,
    cp: r.cp,
    cv: r.cv
  };

  // Transport properties for single-phase states
  if (Number.isFinite(r.density)) {
    // IAPWS transport correlations expect density in g/cm³
    const rho_cgs = r.density * 1e-3; // kg/m³ → g/cm³
    out.thermalConductivity = conductivity(T, rho_cgs);
    out.viscosity = viscosity(T, rho_cgs);
  }

  if (phase === "saturated_liquid") out.quality = 0;
  if (phase === "saturated_vapor") out.quality = 1;

  return out;
}

function mixStates(L, V, x, T, P) {
  return {
    phase: "two_phase",
    phaseLabel: "two_phase",
    quality: x,
    T,
    P,
    specificVolume: NaN,
    density: NaN,
    enthalpy: (1 - x) * L.enthalpy + x * V.enthalpy,
    entropy: (1 - x) * L.entropy + x * V.entropy,
    cp: NaN,
    cv: NaN,
    thermalConductivity: NaN,
    viscosity: NaN
  };
}

/* ============================================================
   Numerical solvers
   ============================================================ */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function solveT(P, target, f) {
  let lo = 273.15, hi = 2273.15;
  let flo = f(lo) - target, fhi = f(hi) - target;

  for (let i = 0; i < MAX_IT && flo * fhi > 0; i++) {
    lo -= 50; hi += 50;
    flo = f(lo) - target;
    fhi = f(hi) - target;
  }

  for (let i = 0; i < MAX_IT; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid) - target;
    if (Math.abs(hi - lo) < T_TOL) return mid;
    if (flo * fmid <= 0) { hi = mid; fhi = fmid; }
    else { lo = mid; flo = fmid; }
  }

  return 0.5 * (lo + hi);
}

function solveP(T, target, f) {
  let lo = 0.000611, hi = 100.0;
  let flo = f(lo) - target, fhi = f(hi) - target;

  for (let i = 0; i < MAX_IT && flo * fhi > 0; i++) {
    lo /= 2; hi *= 1.2;
    flo = f(lo) - target;
    fhi = f(hi) - target;
  }

  for (let i = 0; i < MAX_IT; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid) - target;
    if (Math.abs(hi - lo) < P_TOL) return mid;
    if (flo * fmid <= 0) { hi = mid; fhi = fmid; }
    else { lo = mid; flo = fmid; }
  }

  return 0.5 * (lo + hi);
}
