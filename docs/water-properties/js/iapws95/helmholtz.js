// iapws95/helmholtz.js
// Full IAPWS-95 Helmholtz free energy (COMPLETE & STABLE)

import {
  // Ideal gas
  n0, gamma0,

  // Polynomial residual
  nr, dr, tr,

  // Exponential residual
  ne, de, te, ce,

  // Gaussian terms
  ng, dg, tg, ag, bg,

  // Non-analytic critical terms
  nc, dc, tc, alphac, betac, Ac, Bc
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
    sum += n0[i] * Math.log(1 - Math.exp(-gamma0[i] * tau));
  }

  return sum;
}

export const alpha0_delta      = delta => 1 / delta;
export const alpha0_deltadelta = delta => -1 / (delta * delta);

export function alpha0_tau(delta, tau) {
  let sum = n0[1] + n0[2] / tau;
  for (let i = 3; i < n0.length; i++) {
    const e = Math.exp(-gamma0[i] * tau);
    sum += n0[i] * gamma0[i] * e / (1 - e);
  }
  return sum;
}

export function alpha0_tautau(delta, tau) {
  let sum = -n0[2] / (tau * tau);
  for (let i = 3; i < n0.length; i++) {
    const g = gamma0[i];
    const e = Math.exp(-g * tau);
    sum -= n0[i] * g * g * e / ((1 - e) ** 2);
  }
  return sum;
}

/* ============================================================
   Residual part αr
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * delta ** dr[i] * tau ** tr[i];
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * delta ** de[i] * tau ** te[i]
      * Math.exp(-delta ** ce[i]);
  }

  // Gaussian
  for (let i = 0; i < ng.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    sum += ng[i] * delta ** dg[i] * tau ** tg[i]
      * Math.exp(-ag[i] * d * d - bg[i] * t * t);
  }

  // Critical
  for (let i = 0; i < nc.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    const theta = (1 - tau) + Ac[i] * Math.abs(d) ** (1 / betac[i]);
    const Delta = theta * theta + Bc[i] * Math.abs(d) ** alphac[i];
    sum += nc[i] * Delta ** dc[i] * tau ** tc[i];
  }

  return sum;
}

/* ============================================================
   First & second derivatives (only needed ones)
   ============================================================ */

export function alphar_delta(delta, tau) {
  let sum = 0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * delta ** (dr[i] - 1) * tau ** tr[i];
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    const dc = delta ** ce[i];
    sum += ne[i] * delta ** (de[i] - 1) * tau ** te[i]
      * Math.exp(-dc) * (de[i] - ce[i] * dc);
  }

  // Gaussian
  for (let i = 0; i < ng.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    const e = Math.exp(-ag[i] * d * d - bg[i] * t * t);
    sum += ng[i] * tau ** tg[i] * delta ** (dg[i] - 1)
      * e * (dg[i] - 2 * ag[i] * delta * d);
  }

  return sum;
}

export function alphar_deltadelta(delta, tau) {
  let sum = 0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1)
      * delta ** (dr[i] - 2) * tau ** tr[i];
  }

  for (let i = 0; i < ne.length; i++) {
    const dc = delta ** ce[i];
    const e = Math.exp(-dc);
    sum += ne[i] * delta ** (de[i] - 2) * tau ** te[i]
      * e * (
        (de[i] - ce[i] * dc) * (de[i] - 1 - ce[i] * dc)
        - ce[i] * ce[i] * dc
      );
  }

  return sum;
}
