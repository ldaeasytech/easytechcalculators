// iapws95/derivatives.js
// Dimensionless Helmholtz energy and derivatives
// Consistent with FULL IAPWS-95 helmholtz.js

console.log("LOADED DERIVATIVES — FULL IAPWS-95");

import {
  alpha0,
  alpha0_tau,
  alpha0_tautau,
  alpha0_delta,
  alpha0_deltadelta,
  alphar,
  alphar_delta,
  alphar_deltadelta
} from "./helmholtz.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

export function helmholtz(T, rho, Tc, rhoc) {

  const delta = rho / rhoc;
  const tau   = Tc / T;

  // Ideal-gas part
  const a0    = alpha0(delta, tau);
  const a0_t  = alpha0_tau(delta, tau);
  const a0_tt = alpha0_tautau(delta, tau);
  const a0_d  = alpha0_delta(delta);
  const a0_dd = alpha0_deltadelta(delta);

  // Residual part
  const ar    = alphar(delta, tau);
  const ar_d  = alphar_delta(delta, tau);
  const ar_dd = alphar_deltadelta(delta, tau);

  return {
    delta,
    tau,

    // Helmholtz energy
    a0,
    ar,

    // τ-derivatives (ideal only for now)
    a0_t,
    a0_tt,

    // δ-derivatives
    a0_d,
    a0_dd,
    ar_d,
    ar_dd
  };
}
