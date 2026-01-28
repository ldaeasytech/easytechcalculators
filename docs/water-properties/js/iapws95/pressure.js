// iapws95/pressure.js
// Pressure and derivative from Helmholtz EOS

import { Tc, rhoc, R } from "./constants95.js";
import {
  alphar,
  alphar_delta,
  alphar_deltadelta
} from "./helmholtz.js";

/*
  delta = rho / rhoc
  tau   = Tc / T
*/

/**
 * Pressure P [MPa] from density rho [kg/m^3] and temperature T [K]
 */
export function pressureFromRho(T, rho) {
  const delta = rho / rhoc;
  const tau = Tc / T;

  const ar_d = alphar_delta(delta, tau);

  // P = rho * R * T * (1 + delta * ∂αʳ/∂δ)
  return rho * R * T * (1 + delta * ar_d) * 1e-3;
}

/**
 * ∂P/∂rho [MPa·m^3/kg]
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

  return R * T * term * 1e-3;
}
