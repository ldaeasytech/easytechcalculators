// iapws95/pressure.js
// Pressure from full IAPWS-95 Helmholtz EOS

import { Tc, rhoc, R } from "./constants95.js";
import {
  alpha0_delta,
  alphar_delta,
  alphar_deltadelta
} from "./helmholtz.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/**
 * Pressure P [MPa]
 */
export function pressureFromRho(T, rho) {

  const delta = rho / rhoc;
  const tau = Tc / T;

  const a0_d = alpha0_delta(delta);
  const ar_d = alphar_delta(delta, tau);

  const P =
    rho * R * T * (1 + delta * (a0_d + ar_d));

  return P * 1e-6; // Pa → MPa
}

/**
 * ∂P/∂ρ at constant T [MPa·m³/kg]
 */
export function dPdrho(T, rho) {

  const delta = rho / rhoc;
  const tau = Tc / T;

  const ar_d = alphar_delta(delta, tau);
  const ar_dd = alphar_deltadelta(delta, tau);

  const term =
    1 +
    2 * delta * ar_d +
    delta * delta * ar_dd;

  const dP =
    R * T * term;

  return dP * 1e-6;
}
