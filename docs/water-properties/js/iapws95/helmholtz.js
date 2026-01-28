import { Tc, rhoc } from "./constants95.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

// Ideal-gas part (exact)
export function alpha0(delta, tau) {
  return Math.log(delta) + 1.0 + Math.log(tau);
}

export function alpha0_tau(tau) {
  return 1.0 / tau;
}

export function alpha0_tautau(tau) {
  return -1.0 / (tau * tau);
}

// Simple residual (stable core, extendable later)
const nr = [ -0.5, 0.3, -0.1 ];
const dr = [ 1, 2, 3 ];
const tr = [ 0, 1, 2 ];

export function alphar(delta, tau) {
  let sum = 0;
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * Math.pow(delta, dr[i]) * Math.pow(tau, tr[i]);
  }
  return sum;
}

export function alphar_delta(delta, tau) {
  let sum = 0;
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] *
      Math.pow(delta, dr[i] - 1) *
      Math.pow(tau, tr[i]);
  }
  return sum;
}

export function alphar_deltadelta(delta, tau) {
  let sum = 0;
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * dr[i] * (dr[i] - 1) *
      Math.pow(delta, dr[i] - 2) *
      Math.pow(tau, tr[i]);
  }
  return sum;
}

export function alphar_tau(delta, tau) {
  let sum = 0;
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i] - 1);
  }
  return sum;
}

export function alphar_tautau(delta, tau) {
  let sum = 0;
  for (let i = 0; i < nr.length; i++) {
    sum += nr[i] * tr[i] * (tr[i] - 1) *
      Math.pow(delta, dr[i]) *
      Math.pow(tau, tr[i] - 2);
  }
  return sum;
}
