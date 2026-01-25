// solver.js — IF97 solver with saturation lock, robust inverse modes, and Region5 auto-select
//
// Supported modes:
//   TP, Tx, Px, Ph, Ts
//
// Coherence requirements:
//   - Region1 and Region2 throw at saturation: MUST NOT call them if |P - Psat(T)| < 1e-6
//   - Region4 is authoritative for saturation properties and phase boundaries
//   - Region5 auto-selected at very high temperatures (IF97 Region 5)
//
// Units:
//   T in K
//   P in MPa
//   h in kJ/kg
//   s in kJ/(kg·K)

import { region1 } from "./if97/region1.js";
import { region2 } from "./if97/region2.js";
import { region5 } from "./if97/region5.js";

import {
  Psat,
  Tsat,

  // sat liquid
  rho_f_sat,
  v_f_sat,
  h_f_sat,
  s_f_sat,
  cp_f_sat,
  cv_f_sat,

  // sat vapor
  rho_g_sat,
  v_g_sat,
  h_g_sat,
  s_g_sat,
  cp_g_sat,
  cv_g_sat
} from "./if97/region4.js";

// Must match Region1/Region2 saturation guard tolerance
const SAT_EPS = 1e-6;

// Quality tolerance
const X_EPS = 1e-10;

// Numerical solver settings
const MAX_IT = 200;
const T_TOL = 1e-7;
const P_TOL = 1e-10;

// Robust fallback bands near saturation
// (tuned for polynomial sat fits; can be adjusted if needed)
const SAT_P_BAND_TS = 5e-5; // MPa band for Ts inversion fallback
const SAT_T_BAND_PH = 2e-4; // K band for Ph inversion fallback

// IF97 Region 5 practical domain (high temperature steam)
function isRegion5(T, P) {
  return T > 1073.15 && T <= 2273.15 && P <= 50.0;
}

export function solve(inputs) {
  const { mode } = inputs;

  /* ========================================================
     TP MODE
     ======================================================== */
  if (mode === "TP") {
    const T = inputs.temperature;
    const P = inputs.pressure;

    const Ps = Psat(T);

    // Saturation lock: do NOT call Region1/2 at saturation
    if (Math.abs(P - Ps) < SAT_EPS) {
      return withPhase("saturated_vapor", satVaporState(T), T, Ps);
    }

    // Liquid side
    if (P > Ps) {
      return withPhase("compressed_liquid", region1(T, P), T, P);
    }

    // Vapor side: Region5 auto-select if valid
    if (isRegion5(T, P)) {
      return withPhase("high_temperature_steam", region5(T, P), T, P);
    }

    return withPhase("superheated_vapor", region2(T, P), T, P);
  }

  /* ========================================================
     Tx MODE
     ======================================================== */
  if (mode === "Tx") {
    const T = inputs.temperature;
    const x = inputs.quality;

    const P = Psat(T);

    if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  /* ========================================================
     Px MODE
     ======================================================== */
  if (mode === "Px") {
    const P = inputs.pressure;
    const x = inputs.quality;

    const T = Tsat(P);

    if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, P);
    if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, P);

    return mixStates(satLiquidState(T), satVaporState(T), x, T, P);
  }

  /* ========================================================
     Ph MODE (robust near saturation + Region5 auto-select)
     ======================================================== */
  if (mode === "Ph") {
    const P = inputs.pressure;
    const h = inputs.enthalpy;

    const T_sat = Tsat(P);
    const hf = h_f_sat(T_sat);
    const hg = h_g_sat(T_sat);

    // 1) Direct 2-phase check using sat bounds
    if (isFinite(hf) && isFinite(hg) && h >= hf - 1e-9 && h <= hg + 1e-9) {
      const x = clamp01((h - hf) / (hg - hf));

      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T_sat), T_sat, P);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T_sat), T_sat, P);

      return mixStates(satLiquidState(T_sat), satVaporState(T_sat), x, T_sat, P);
    }

    // 2) Liquid side (Region1)
    if (h < hf) {
      const Tsol = solveT_given_P_and_target(P, h, (Tg) => region1(Tg, P).enthalpy);
      return withPhase("compressed_liquid", region1(Tsol, P), Tsol, P);
    }

    // 3) Vapor side inversion (Region2 or Region5)
    const Tsol = solveT_given_P_and_target(P, h, (Tg) => {
      if (isRegion5(Tg, P)) return region5(Tg, P).enthalpy;
      return region2(Tg, P).enthalpy;
    });

    // 4) Quality fallback if solver lands near saturation temperature
    if (Math.abs(Tsol - T_sat) < SAT_T_BAND_PH && isFinite(hf) && isFinite(hg)) {
      const xq = (h - hf) / (hg - hf);
      if (xq > -1e-6 && xq < 1 + 1e-6) {
        const x = clamp01(xq);

        if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T_sat), T_sat, P);
        if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T_sat), T_sat, P);

        return mixStates(satLiquidState(T_sat), satVaporState(T_sat), x, T_sat, P);
      }
    }

    // 5) Return single-phase
    if (isRegion5(Tsol, P)) {
      return withPhase("high_temperature_steam", region5(Tsol, P), Tsol, P);
    }

    return withPhase("superheated_vapor", region2(Tsol, P), Tsol, P);
  }

  /* ========================================================
     Ts MODE (robust two-phase + Region5 auto-select)
     ======================================================== */
  if (mode === "Ts") {
    const T = inputs.temperature;
    const s = inputs.entropy;

    const Ps = Psat(T);
    const sf = s_f_sat(T);
    const sg = s_g_sat(T);

    // 1) Direct 2-phase check using sat bounds
    if (isFinite(sf) && isFinite(sg) && s >= sf - 1e-9 && s <= sg + 1e-9) {
      const x = clamp01((s - sf) / (sg - sf));

      if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, Ps);
      if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, Ps);

      return mixStates(satLiquidState(T), satVaporState(T), x, T, Ps);
    }

    // 2) Solve for P from s(T,P)=target
    const Psol = solveP_given_T_and_target(T, s, (Pg) => {
      // Avoid Region1/2 saturation throws
      if (Math.abs(Pg - Ps) < SAT_EPS) {
        // Use sat vapor entropy to push root away
        return sg;
      }

      // liquid side
      if (Pg > Ps) return region1(T, Pg).entropy;

      // vapor side
      if (isRegion5(T, Pg)) return region5(T, Pg).entropy;
      return region2(T, Pg).entropy;
    });

    // 3) Quality-based fallback when Psol is near saturation
    if (Math.abs(Psol - Ps) < SAT_P_BAND_TS && isFinite(sf) && isFinite(sg)) {
      const xq = (s - sf) / (sg - sf);

      if (xq > -1e-6 && xq < 1 + 1e-6) {
        const x = clamp01(xq);

        if (x <= X_EPS) return withPhase("saturated_liquid", satLiquidState(T), T, Ps);
        if (1 - x <= X_EPS) return withPhase("saturated_vapor", satVaporState(T), T, Ps);

        return mixStates(satLiquidState(T), satVaporState(T), x, T, Ps);
      }
    }

    // 4) Final single-phase decision
    if (Math.abs(Psol - Ps) < SAT_EPS) {
      // by convention return sat vapor (and auto-quality=1)
      return withPhase("saturated_vapor", satVaporState(T), T, Ps);
    }

    if (Psol > Ps) {
      return withPhase("compressed_liquid", region1(T, Psol), T, Psol);
    }

    if (isRegion5(T, Psol)) {
      return withPhase("high_temperature_steam", region5(T, Psol), T, Psol);
    }

    return withPhase("superheated_vapor", region2(T, Psol), T, Psol);
  }

  throw new Error(`Unsupported solver mode: ${mode}`);
}

/* ============================================================
   Saturation state builders (Region4)
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
   Output helpers (auto quality for saturation)
   ============================================================ */

function withPhase(phase, r, T, P) {
  const out = {
    phase,
    T,
    P,
    density: r.density,
    specificVolume: r.specificVolume,
    enthalpy: r.enthalpy,
    entropy: r.entropy,
    cp: r.cp,
    cv: r.cv
  };

  // ✅ auto-quality for saturation & sat endpoints
  if (phase === "saturated_liquid") out.quality = 0;
  if (phase === "saturated_vapor") out.quality = 1;

  return out;
}

function mixStates(L, V, x, T, P) {
  const v = (1 - x) * L.specificVolume + x * V.specificVolume;

  return {
    phase: "two_phase",
    quality: x,
    T,
    P,

    specificVolume: v,
    density: 1 / v,

    enthalpy: (1 - x) * L.enthalpy + x * V.enthalpy,
    entropy: (1 - x) * L.entropy + x * V.entropy,

    // not physically meaningful as a simple mix in your current structure
    cp: NaN,
    cv: NaN
  };
}

/* ============================================================
   Numerical methods
   ============================================================ */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// Solve T such that f(T)=target at fixed P
function solveT_given_P_and_target(P, target, fT) {
  let lo = 273.15;
  let hi = 2273.15;

  let flo = fT(lo) - target;
  let fhi = fT(hi) - target;

  // try to bracket if not bracketed
  for (let i = 0; i < 60 && flo * fhi > 0; i++) {
    lo = Math.max(200, lo - 50);
    hi = hi + 50;
    flo = fT(lo) - target;
    fhi = fT(hi) - target;
  }

  if (flo * fhi > 0) {
    throw new Error("Ph solver: failed to bracket solution in T.");
  }

  for (let it = 0; it < MAX_IT; it++) {
    const mid = 0.5 * (lo + hi);
    const fmid = fT(mid) - target;

    if (Math.abs(hi - lo) < T_TOL) return mid;

    if (flo * fmid <= 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }

  return 0.5 * (lo + hi);
}

// Solve P such that f(P)=target at fixed T
function solveP_given_T_and_target(T, target, fP) {
  let lo = 0.000611;
  let hi = 100.0;

  let flo = fP(lo) - target;
  let fhi = fP(hi) - target;

  // try to bracket if not bracketed
  for (let i = 0; i < 60 && flo * fhi > 0; i++) {
    lo = Math.max(1e-7, lo / 2);
    hi = hi * 1.2;
    flo = fP(lo) - target;
    fhi = fP(hi) - target;
  }

  if (flo * fhi > 0) {
    throw new Error("Ts solver: failed to bracket solution in P.");
  }

  for (let it = 0; it < MAX_IT; it++) {
    const mid = 0.5 * (lo + hi);
    const fmid = fP(mid) - target;

    if (Math.abs(hi - lo) < P_TOL) return mid;

    if (flo * fmid <= 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }

  return 0.5 * (lo + hi);
}
