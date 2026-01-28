// Industrial reduced IAPWS-95 Helmholtz free energy
// Valid for liquid, vapor, and supercritical regions

import {
  nr, dr, tr,
  ne, de, te, ce
} from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/* ============================================================
   Ideal-gas part α⁰
   ============================================================ */

export function alpha0(delta, tau) {
  return Math.log(delta) + 1.0 + Math.log(tau);
}

export function alpha0_tau(tau) {
  return 1.0 / tau;
}

export function alpha0_tautau(tau) {
  return -1.0 / (tau * tau);
}

/* ============================================================
   Residual part αʳ
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0.0;

  // Polynomial terms
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i]);
  }

  // Exponential terms
  for (let i = 0; i < ne.length; i++) {
    const d = de[i];
    const t = te[i];
    const c = ce[i];

    sum += ne[i] *
      Math.pow(delta, d) *
      Math.pow(tau, t) *
      Math.exp(-Math.pow(delta, c));
  }

  return sum;
}

/* ============================================================
   ∂αʳ/∂δ
   ============================================================ */

export function alphar_delta(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] *
      Math.pow(delta, dr[i] - 1) *
      Math.pow(tau, tr[i]);
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    const d = de[i];
    const t = te[i];
    const c = ce[i];
    const dc = Math.pow(delta, c);

    sum += ne[i] *
      Math.pow(delta, d - 1) *
      Math.pow(tau, t) *
      Math.exp(-dc) *
      (d - c * dc);
  }

  return sum;
}

/* ============================================================
   ∂²αʳ/∂δ²
   ============================================================ */

export function alphar_deltadelta(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1) *
      Math.pow(delta, dr[i] - 2) *
      Math.pow(tau, tr[i]);
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    const d = de[i];
    const t = te[i];
    const c = ce[i];
    const dc = Math.pow(delta, c);

    sum += ne[i] *
      Math.pow(delta, d - 2) *
      Math.pow(tau, t) *
      Math.exp(-dc) *
      ((d - c * dc) * (d - 1 - c * dc) - c * c * dc);
  }

  return sum;
}

/* ============================================================
   ∂αʳ/∂τ
   ============================================================ */

export function alphar_tau(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i] - 1);
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * te[i] *
      Math.pow(delta, de[i]) *
      Math.pow(tau, te[i] - 1) *
      Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}

/* ============================================================
   ∂²αʳ/∂τ²
   ============================================================ */

export function alphar_tautau(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] * (tr[i] - 1) *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i] - 2);
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * te[i] * (te[i] - 1) *
      Math.pow(delta, de[i]) *
      Math.pow(tau, te[i] - 2) *
      Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}
