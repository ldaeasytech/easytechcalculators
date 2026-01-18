/**
 * solver.js
 * IF97 state solver (engineering-grade)
 * Solves thermodynamic state from ANY two independent properties
 */

import { computeIF97 } from "./if97.js";
import { Psat } from "./region4.js";

const MAX_ITER = 50;
const TOL = 1e-7;

/**
 * Solve from (T, P) directly
 */
export function solveTP(T, P) {
  return computeIF97(T, P);
}

/**
 * Solve from (P, h)
 */
export function solvePH(P, h_target) {
  let T = 500; // initial guess (K)

  for (let i = 0; i < MAX_ITER; i++) {
    const state = computeIF97(T, P);
    const f = state.enthalpy - h_target;

    if (Math.abs(f) < TOL) return state;

    // numerical derivative dH/dT ≈ Cp
    T -= f / state.cp;
  }

  throw new Error("solvePH did not converge");
}

/**
 * Solve from (P, s)
 */
export function solvePS(P, s_target) {
  let T = 500;

  for (let i = 0; i < MAX_ITER; i++) {
    const state = computeIF97(T, P);
    const f = state.entropy - s_target;

    if (Math.abs(f) < TOL) return state;

    T -= f / state.cp;
  }

  throw new Error("solvePS did not converge");
}

/**
 * Solve from (T, x) — two-phase
 */
export function solveTx(T, x) {
  const P = Psat(T);
  const satL = computeIF97(T, P * 1.000001);
  const satV = computeIF97(T, P * 0.999999);

  return {
    region: 4,
    phase: "two-phase",
    T,
    P,
    quality: x,
    enthalpy: satL.enthalpy + x * (satV.enthalpy - satL.enthalpy),
    entropy: satL.entropy + x * (satV.entropy - satL.entropy),
    specificVolume: satL.specificVolume + x * (satV.specificVolume - satL.specificVolume)
  };
}
