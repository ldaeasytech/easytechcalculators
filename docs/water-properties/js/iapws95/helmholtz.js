// iapws95/helmholtz.js
// IAPWS-95 Helmholtz free energy — PHASE 1
// Polynomial + Exponential residual terms ONLY
// Gaussian & critical terms intentionally disabled

import {
  // Ideal gas
  n0, gamma0,

  // Residual: polynomial + exponential
  nr, dr, tr,
  ne, de, te, ce
} from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/* ============================================================
   Ideal-gas contribution α0
   ============================================================ */

export function alpha0(delta, tau) {
  let sum =
    Math.log(delta) +
    n0[0] +
    n0[1] * tau +
    n0[2] * Math.log(tau);

  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    const e = Math.exp(-g * tau);
    sum += n0[i] * Math.log(1 - e);
  }
  return sum;
}

export const alpha0_delta = (delta) => 1 / delta;
export const alpha0_deltadelta = (delta) => -1 / (delta * delta);

export function alpha0_tau(delta, tau) {
  let sum = n0[1] + n0[2] / tau;
  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    const e = Math.exp(-g * tau);
    sum += n0[i] * g * e / (1 - e);
  }
  return sum;
}

export function alpha0_tautau(delta, tau) {
  let sum = -n0[2] / (tau * tau);
  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    const e = Math.exp(-g * tau);
    const d = 1 - e;
    sum -= n0[i] * g * g * e / (d * d);
  }
  return sum;
}

/* ============================================================
   Residual contribution αr (PHASE 1)
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0.0;

  // --- Polynomial terms
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i]);
  }

  // --- Exponential terms (array-safe)
  const Nexp = Math.min(ne.length, de.length, te.length, ce.length);
  for (let i = 0; i < Nexp; i++) {
    sum += ne[i] *
      Math.pow(delta, de[i]) *
      Math.pow(tau, te[i]) *
      Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}

/* ============================================================
   ∂αr / ∂δ
   ============================================================ */

export function alphar_delta(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] *
      Math.pow(delta, dr[i] - 1) *
      Math.pow(tau, tr[i]);
  }

  // Exponential (array-safe)
  const Nexp = Math.min(ne.length, de.length, te.length, ce.length);
  for (let i = 0; i < Nexp; i++) {
    const dc = Math.pow(delta, ce[i]);
    const e = Math.exp(-dc);

    sum += ne[i] *
      Math.pow(delta, de[i] - 1) *
      Math.pow(tau, te[i]) *
      e *
      (de[i] - ce[i] * dc);
  }

  return sum;
}

/* ============================================================
   ∂²αr / ∂δ²
   ============================================================ */

export function alphar_deltadelta(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1) *
      Math.pow(delta, dr[i] - 2) *
      Math.pow(tau, tr[i]);
  }

  // Exponential (array-safe)
  const Nexp = Math.min(ne.length, de.length, te.length, ce.length);
  for (let i = 0; i < Nexp; i++) {
    const dc = Math.pow(delta, ce[i]);
    const e = Math.exp(-dc);

    sum += ne[i] *
      Math.pow(delta, de[i] - 2) *
      Math.pow(tau, te[i]) *
      e *
      (
        (de[i] - ce[i] * dc) *
        (de[i] - 1 - ce[i] * dc)
        - ce[i] * ce[i] * dc
      );
  }

  return sum;
}

console.log("LOADED helmholtz.js — PHASE 1 (poly + exp only)");
