// iapws95/helmholtz.js
// Full IAPWS-95 Helmholtz free energy and derivatives
// Wagner & Pruss (2002) – complete single-phase implementation

import {
  // Ideal gas
  n0, gamma0,

  // Polynomial residual
  nr, dr, tr,

  // Exponential residual
  ne, de, te, ce,

  // Gaussian
  ng, dg, tg, ag, bg,

  // Non-analytic critical
  nc, dc, tc, alphac, betac, Ac, Bc
} from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/* ============================================================
   Ideal-gas part α⁰
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

export const alpha0_delta = delta => 1 / delta;
export const alpha0_deltadelta = delta => -1 / (delta * delta);

/* ============================================================
   Residual Helmholtz αʳ
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * delta ** dr[i] * tau ** tr[i];
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * delta ** de[i] * tau ** te[i] *
      Math.exp(-delta ** ce[i]);
  }

  // Gaussian
  for (let i = 0; i < ng.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    sum += ng[i] * delta ** dg[i] * tau ** tg[i] *
      Math.exp(-ag[i] * d * d - bg[i] * t * t);
  }

  // Critical
  for (let i = 0; i < nc.length; i++) {
    const d = delta - 1;
    const theta =
      (1 - tau) + Ac[i] * (d * d) ** (1 / (2 * betac[i]));
    const Delta =
      theta * theta + Bc[i] * (d * d) ** alphac[i];
    sum += nc[i] * Delta ** dc[i] * tau ** tc[i];
  }

  return sum;
}

/* ============================================================
   δ-derivatives
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
    sum += ne[i] * delta ** (de[i] - 1) * tau ** te[i] *
      Math.exp(-dc) * (de[i] - ce[i] * dc);
  }

  // Gaussian
  for (let i = 0; i < ng.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    const e = Math.exp(-ag[i] * d * d - bg[i] * t * t);
    sum += ng[i] * tau ** tg[i] * delta ** (dg[i] - 1) * e *
      (dg[i] - 2 * ag[i] * delta * d);
  }

  // Critical
  for (let i = 0; i < nc.length; i++) {
    const d = delta - 1;
    const m = (d * d) ** (1 / (2 * betac[i]) - 1);
    const theta =
      (1 - tau) + Ac[i] * (d * d) ** (1 / (2 * betac[i]));
    const Delta =
      theta * theta + Bc[i] * (d * d) ** alphac[i];

    const dDelta =
      (Ac[i] * theta * m / betac[i] +
       2 * Bc[i] * alphac[i] * (d * d) ** (alphac[i] - 1)) * d;

    sum += nc[i] * dc[i] * Delta ** (dc[i] - 1) *
      dDelta * tau ** tc[i];
  }

  return sum;
}

export function alphar_deltadelta(delta, tau) {
  let sum = 0;

  // Polynomial
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1) *
      delta ** (dr[i] - 2) * tau ** tr[i];
  }

  // Exponential
  for (let i = 0; i < ne.length; i++) {
    const dc = delta ** ce[i];
    sum += ne[i] * delta ** (de[i] - 2) * tau ** te[i] *
      Math.exp(-dc) *
      ((de[i] - ce[i] * dc) *
       (de[i] - 1 - ce[i] * dc) -
       ce[i] * ce[i] * dc);
  }

  // Gaussian (full second derivative)
  for (let i = 0; i < ng.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    const e = Math.exp(-ag[i] * d * d - bg[i] * t * t);

    const A = dg[i] - 2 * ag[i] * delta * d;
    const B = (dg[i] - 1) - 2 * ag[i] * d * (2 * delta - 1);

    sum += ng[i] * tau ** tg[i] * delta ** (dg[i] - 2) * e *
      (A * B - 2 * ag[i] * delta * delta);
  }

  return sum;
}

/* ============================================================
   τ-derivatives
   ============================================================ */

export function alphar_tau(delta, tau) {
  let sum = 0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] * delta ** dr[i] * tau ** (tr[i] - 1);
  }

  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * te[i] * delta ** de[i] *
      tau ** (te[i] - 1) * Math.exp(-delta ** ce[i]);
  }

  for (let i = 0; i < ng.length; i++) {
    const d = delta - 1;
    const t = tau - 1;
    const e = Math.exp(-ag[i] * d * d - bg[i] * t * t);
    sum += ng[i] * delta ** dg[i] * tau ** (tg[i] - 1) * e *
      (tg[i] - 2 * bg[i] * tau * t);
  }

  for (let i = 0; i < nc.length; i++) {
    const d = delta - 1;
    const theta =
      (1 - tau) + Ac[i] * (d * d) ** (1 / (2 * betac[i]));
    const Delta =
      theta * theta + Bc[i] * (d * d) ** alphac[i];

    sum += nc[i] * tau ** (tc[i] - 1) * Delta ** (dc[i] - 1) *
      (tc[i] * Delta - 2 * dc[i] * tau * theta);
  }

  return sum;
}

export function alphar_tautau(delta, tau) {
  let sum = 0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] * (tr[i] - 1) *
      delta ** dr[i] * tau ** (tr[i] - 2);
  }

  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] * te[i] * (te[i] - 1) *
      delta ** de[i] * tau ** (te[i] - 2) *
      Math.exp(-delta ** ce[i]);
  }

  return sum;
}

export function alphar_deltatau(delta, tau) {
  let sum = 0;

  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * tr[i] *
      delta ** (dr[i] - 1) * tau ** (tr[i] - 1);
  }

  for (let i = 0; i < ne.length; i++) {
    const dc = delta ** ce[i];
    sum += ne[i] * te[i] * delta ** (de[i] - 1) *
      tau ** (te[i] - 1) * Math.exp(-dc) *
      (de[i] - ce[i] * dc);
  }

  return sum;
}
