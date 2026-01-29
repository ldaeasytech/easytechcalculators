// iapws95/helmholtz.js
// IAPWS-95 Helmholtz free energy (SAFE CORE VERSION)
//
// Includes:
//  - Ideal gas part α0
//  - Residual polynomial + exponential terms
//
// Excludes (for now):
//  - Gaussian terms
//  - Non-analytic critical terms
//
// This avoids NaNs and ensures solver convergence.

import {
  // Ideal gas
  n0, gamma0,

  // Polynomial residual
  nr, dr, tr,

  // Exponential residual
  ne, de, te, ce
} from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/* ============================================================
   Ideal-gas part α0
   ============================================================ */

export function alpha0(delta, tau) {
  let sum =
    Math.log(delta) +
    n0[0] +
    n0[1] * tau +
    n0[2] * Math.log(tau);

  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    sum += n0[i] * Math.log(1 - Math.exp(-g * tau));
  }

  return sum;
}

export function alpha0_tau(tau) {
  let sum = n0[1] + n0[2] / tau;

  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    const e = Math.exp(-g * tau);
    sum += n0[i] * g * e / (1 - e);
  }

  return sum;
}

export function alpha0_tautau(tau) {
  let sum = -n0[2] / (tau * tau);

  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    const e = Math.exp(-g * tau);
    sum -= n0[i] * g * g * e / ((1 - e) * (1 - e));
  }

  return sum;
}

export function alpha0_delta(delta) {
  return 1 / delta;
}

export function alpha0_deltadelta(delta) {
  return -1 / (delta * delta);
}

/* ============================================================
   Residual part αr (polynomial + exponential only)
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0.0;

  // Polynomial terms
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i]
      * Math.pow(delta, dr[i])
      * Math.pow(tau, tr[i]);
  }

  // Exponential terms
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i]
      * Math.pow(delta, de[i])
      * Math.pow(tau, te[i])
      * Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}

/* ============================================================
   Residual derivatives w.r.t delta
   ============================================================ */

export function alphar_delta(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i]
      * Math.pow(delta, dr[i] - 1)
      * Math.pow(tau, tr[i]);
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    const dc = Math.pow(delta, ce[i]);
    sum += ne[i]
      * Math.pow(delta, de[i] - 1)
      * Math.pow(tau, te[i])
      * Math.exp(-dc)
      * (de[i] - ce[i] * dc);
  }

  return sum;
}

export function alphar_deltadelta(delta, tau) {
  let sum = 0.0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1)
      * Math.pow(delta, dr[i] - 2)
      * Math.pow(tau, tr[i]);
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    const dc = Math.pow(delta, ce[i]);
    sum += ne[i]
      * Math.pow(delta, de[i] - 2)
      * Math.pow(tau, te[i])
      * Math.exp(-dc)
      * (
        (de[i] - ce[i] * dc) *
        (de[i] - 1 - ce[i] * dc) -
        ce[i] * ce[i] * dc
      );
  }

  return sum;
}

/* ============================================================
   Residual derivatives w.r.t tau
   ============================================================ */

export function alphar_tau(delta, tau) {
  let sum = 0.0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i]
      * Math.pow(delta, dr[i])
      * Math.pow(tau, tr[i] - 1);
  }

  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * te[i]
      * Math.pow(delta, de[i])
      * Math.pow(tau, te[i] - 1)
      * Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}

export function alphar_tautau(delta, tau) {
  let sum = 0.0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] * (tr[i] - 1)
      * Math.pow(delta, dr[i])
      * Math.pow(tau, tr[i] - 2);
  }

  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * te[i] * (te[i] - 1)
      * Math.pow(delta, de[i])
      * Math.pow(tau, te[i] - 2)
      * Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}

export function alphar_deltatau(delta, tau) {
  let sum = 0.0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * tr[i]
      * Math.pow(delta, dr[i] - 1)
      * Math.pow(tau, tr[i] - 1);
  }

  for (let i = 0; i < ne.length; i++) {
    const dc = Math.pow(delta, ce[i]);
    sum += ne[i] * te[i]
      * Math.pow(delta, de[i] - 1)
      * Math.pow(tau, te[i] - 1)
      * Math.exp(-dc)
      * (de[i] - ce[i] * dc);
  }

  return sum;
}
