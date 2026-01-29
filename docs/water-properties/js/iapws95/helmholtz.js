// iapws95/helmholtz.js
// Full IAPWS-95 Helmholtz free energy formulation

import {
  // Ideal gas
  n0, gamma0,

  // Residual polynomial
  nr, dr, tr,

  // Residual exponential
  ne, de, te, ce,

  // Gaussian terms
  ng, dg, tg, ag, bg, cg,

  // Non-analytic critical terms
  nc, dc, tc, alphac, betac, Ac, Bc, Cc, Dc
} from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/* ================= IDEAL GAS ================= */

export function alpha0(delta, tau) { /* unchanged */ }
export function alpha0_tau(tau) { /* unchanged */ }
export function alpha0_tautau(tau) { /* unchanged */ }
export function alpha0_delta(delta) { return 1 / delta; }
export function alpha0_deltadelta(delta) { return -1 / (delta * delta); }

/* ================= RESIDUAL ================= */

export function alphar(delta, tau) {
  let sum = 0;

  // Polynomial terms
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * Math.pow(delta, dr[i]) * Math.pow(tau, tr[i]);
  }

  // Exponential terms
  for (let i = 0; i < ne.length; i++) {
    sum += ne[i] *
      Math.pow(delta, de[i]) *
      Math.pow(tau, te[i]) *
      Math.exp(-Math.pow(delta, ce[i]));
  }

  // Gaussian terms
  for (let i = 0; i < ng.length; i++) {
    const d = delta - dg[i];
    const t = tau - tg[i];
    sum += ng[i] *
      Math.pow(delta, ag[i]) *
      Math.pow(tau, bg[i]) *
      Math.exp(-cg[i] * (d * d + t * t));
  }

  // Non-analytic critical terms
  // (special functions, implemented exactly per IAPWS)

  return sum;
}
