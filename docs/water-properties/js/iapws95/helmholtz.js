// iapws95/helmholtz.js
// IAPWS-95 Helmholtz free energy — SAFE, NaN-FREE CORE

import {
  n0, gamma0,
  nr, dr, tr,
  ne, de, te, ce
} from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/* ============================================================
   Ideal gas part α0
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

export function alpha0_delta(delta) {
  return 1 / delta;
}

export function alpha0_deltadelta(delta) {
  return -1 / (delta * delta);
}

/* ============================================================
   Residual part αr
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0.0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i]
      * Math.pow(delta, dr[i])
      * Math.pow(tau, tr[i]);
  }

  const N = Math.min(ne.length, de.length, te.length, ce.length);
  for (let i = 0; i < N; i++) {
    sum += ne[i]
      * Math.pow(delta, de[i])
      * Math.pow(tau, te[i])
      * Math.exp(-Math.pow(delta, ce[i]));
  }

  return sum;
}

/* ============================================================
   ∂αr / ∂δ
   ============================================================ */

export function alphar_delta(delta, tau) {
  let sum = 0.0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i]
      * Math.pow(delta, dr[i] - 1)
      * Math.pow(tau, tr[i]);
  }

  const N = Math.min(ne.length, de.length, te.length, ce.length);
  for (let i = 0; i < N; i++) {
    const dc = Math.pow(delta, ce[i]);
    sum += ne[i]
      * Math.pow(delta, de[i] - 1)
      * Math.pow(tau, te[i])
      * Math.exp(-dc)
      * (de[i] - ce[i] * dc);
  }

  return sum;
}

/* ============================================================
   ∂²αr / ∂δ²
   ============================================================ */

export function alphar_deltadelta(delta, tau) {
  let sum = 0.0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1)
      * Math.pow(delta, dr[i] - 2)
      * Math.pow(tau, tr[i]);
  }

  const N = Math.min(ne.length, de.length, te.length, ce.length);
  for (let i = 0; i < N; i++) {
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
