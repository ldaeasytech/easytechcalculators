// iapws95/derivatives.js
// Dimensionless Helmholtz energy and derivatives (NO thermodynamic scaling)

console.log("LOADED DERIVATIVES v2026-01-29 FIXED");

import {
  alpha0,
  alpha0_tau,
  alpha0_tautau,
  alpha0_delta,
  alpha0_deltadelta,
  alphar,
  alphar_delta,
  alphar_deltadelta,
  alphar_tau,
  alphar_tautau,
  alphar_deltatau
} from "./helmholtz.js";

export function helmholtz(T, rho, Tc, rhoc) {

  const delta = rho / rhoc;
  const tau   = Tc / T;

  return {
    delta,
    tau,

    // Helmholtz energy
    a0: alpha0(delta, tau),
    ar: alphar(delta, tau),

    // First derivatives wrt tau
    a0_t: alpha0_tau(delta, tau),
    ar_t: alphar_tau(delta, tau),

    // Second derivatives wrt tau
    a0_tt: alpha0_tautau(delta, tau),
    ar_tt: alphar_tautau(delta, tau),

    // Delta derivatives
    a0_d:  alpha0_delta(delta),
    a0_dd: alpha0_deltadelta(delta),
    ar_d:  alphar_delta(delta, tau),
    ar_dd: alphar_deltadelta(delta, tau),

    // Mixed derivative
    ar_dt: alphar_deltatau(delta, tau)
  };
}
