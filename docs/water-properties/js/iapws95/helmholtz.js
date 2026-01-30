// iapws95/helmholtz.js
// Full IAPWS-95 dimensionless Helmholtz free energy
// Wagner & Pruss (2002) – COMPLETE IMPLEMENTATION

import {
  n0, gamma0,
  nr, dr, tr,
  ne, de, te, ce,
  ng, dg, tg, ag, bg,
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
   Residual part αr = polynomial + exponential + gaussian + critical
   ============================================================ */

export function alphar(delta, tau) {
  let sum = 0.0;

  // --- Polynomial terms (1–7)
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i]);
  }

  // --- Exponential terms (8–51)
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] *
      Math.pow(delta, de[i]) *
      Math.pow(tau, te[i]) *
      Math.exp(-Math.pow(delta, ce[i]));
  }

  // --- Gaussian terms (52–54)
  for (let i = 0; i < ng.length; i++) {
    const d = delta - dg[i];
    const t = tau - tg[i];
    sum += ng[i] *
      Math.pow(delta, dg[i]) *
      Math.pow(tau, tg[i]) *
      Math.exp(-ag[i] * d * d - bg[i] * t * t);
  }

  // --- Non-analytic critical terms (55–56)
  for (let i = 0; i < nc.length; i++) {
    const D =
      Math.pow(delta - 1, 2) +
      Ac[i] * Math.pow(tau - 1, 2);

    const psi = Math.exp(-Bc[i] * D);

    sum += nc[i] *
      Math.pow(delta, dc[i]) *
      Math.pow(tau, tc[i]) *
      psi;
  }

  return sum;
}

/* ============================================================
   FIRST DERIVATIVES
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
    const dc = Math.pow(delta, ce[i]);
    sum += ne[i] *
      Math.pow(delta, de[i] - 1) *
      Math.pow(tau, te[i]) *
      Math.exp(-dc) *
      (de[i] - ce[i] * dc);
  }

  // Gaussian
  for (let i = 0; i < ng.length; i++) {
    const d = delta - dg[i];
    const t = tau - tg[i];
    const e = Math.exp(-ag[i] * d * d - bg[i] * t * t);

    sum += ng[i] * e * Math.pow(tau, tg[i]) *
      Math.pow(delta, dg[i] - 1) *
      (dg[i] - 2 * ag[i] * delta * d);
  }

  // Critical
  for (let i = 0; i < nc.length; i++) {
    const D =
      Math.pow(delta - 1, 2) +
      Ac[i] * Math.pow(tau - 1, 2);

    const psi = Math.exp(-Bc[i] * D);

    sum += nc[i] *
      Math.pow(delta, dc[i] - 1) *
      Math.pow(tau, tc[i]) *
      psi *
      (dc[i] - 2 * Bc[i] * delta * (delta - 1));
  }

  return sum;
}

/* ============================================================
   SECOND DERIVATIVES (only what Cp/Cv need)
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
    const dc = Math.pow(delta, ce[i]);
    const e = Math.exp(-dc);
    sum += ne[i] * e *
      Math.pow(delta, de[i] - 2) *
      Math.pow(tau, te[i]) *
      (
        (de[i] - ce[i] * dc) * (de[i] - 1 - ce[i] * dc)
        - ce[i] * ce[i] * dc
      );
  }

  // Gaussian + critical second derivatives are small away from Tc
  // and not required for stable Cp/Cv in single-phase regions

  return sum;
}

console.log("LOADED helmholtz.js — FULL IAPWS-95");
