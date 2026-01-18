// solver.js
// Thermodynamic state solver built on IF97 core
// INTERNAL UNITS:
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   s  → kJ/(kg·K)

import { computeIF97 } from "./if97/if97.js";
import { Psat } from "./if97/region4.js";

const MAX_ITER = 50;
const TOL = 1e-7;

/* ============================================================
   Direct solvers
   ============================================================ */

/**
 * Solve from (T, P)
 */
export function solveTP(T, P) {
  return computeIF97(T, P);
}

/**
 * Solve from (T, x) — two-phase only
 */
export function solveTx(T, x) {
  if (x < 0 || x > 1) {
    throw new Error("Quality x must be between 0 and 1");
  }

  const P = Psat(T);

  // Slight offsets to force single-phase evaluation
  const satL = computeIF97(T, P * 1.000001);
  const satV = computeIF97(T, P * 0.999999);

  return {
    region: 4,
    phase: "two-phase",
    T,
    P,
    quality: x,
    density:
      1 /
      (satL.specificVolume +
        x * (satV.specificVolume - satL.specificVolume)),
    specificVolume:
      satL.specificVolume +
      x * (satV.specificVolume - satL.specificVolume),
    enthalpy:
      satL.enthalpy + x * (satV.enthalpy - satL.enthalpy),
    entropy:
      satL.entropy + x * (satV.entropy - satL.entropy)
  };
}

/* ============================================================
   Inverse solvers (Newton iteration)
   ============================================================ */

/**
 * Solve from (P, h)
 */
export function solvePH(P, hTarget) {
  let T = 500; // initial guess [K]

  for (let i = 0; i < MAX_ITER; i++) {
    const state = computeIF97(T, P);

    const f = state.enthalpy - hTarget;
    if (Math.abs(f) < TOL) return state;

    // dh/dT at constant P ≈ Cp
    const dHdT = state.cp;
    if (!isFinite(dHdT) || dHdT <= 0) {
      throw new Error("Invalid Cp during PH solve");
    }

    T -= f / dHdT;
  }

  throw new Error("solvePH did not converge");
}

/**
 * Solve from (P, s)
 */
export function solvePS(P, sTarget) {
  let T = 500;

  for (let i = 0; i < MAX_ITER; i++) {
    const state = computeIF97(T, P);

    const f = state.entropy - sTarget;
    if (Math.abs(f) < TOL) return state;

    // ds/dT ≈ Cp / T
    const dSdT = state.cp / T;
    if (!isFinite(dSdT) || dSdT <= 0) {
      throw new Error("Invalid Cp/T during PS solve");
    }

    T -= f / dSdT;
  }

  throw new Error("solvePS did not converge");
}

/* ============================================================
   Generic dispatcher
   ============================================================ */

/**
 * Solve from any supported input pair
 *
 * Supported:
 *  - (T, P)
 *  - (P, h)
 *  - (P, s)
 *  - (T, x)
 */
export function solve(inputs) {
  const keys = Object.keys(inputs).sort().join(",");

  switch (keys) {
    case "P,T":
      return solveTP(inputs.T, inputs.P);

    case "P,h":
      return solvePH(inputs.P, inputs.h);

    case "P,s":
      return solvePS(inputs.P, inputs.s);

    case "T,x":
      return solveTx(inputs.T, inputs.x);

    default:
      throw new Error(
        "Unsupported property pair. Allowed: (T,P), (P,h), (P,s), (T,x)"
      );
  }
}
