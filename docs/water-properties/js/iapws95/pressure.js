// iapws95/pressure.js
// Pressure from full IAPWS-95 Helmholtz EOS (corrected)

import { Tc, rhoc, R } from "./constants95.js";
import {
  alpha0_delta,
  alpha0_deltadelta,
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

  const a0_d = alpha0_delta(delta);
  const a0_dd = alpha0_deltadelta(delta);

  const ar_d = alphar_delta(delta, tau);
  const ar_dd = alphar_deltadelta(delta, tau);

  const term =
    1 +
    2 * delta * (a0_d + ar_d) +
    delta * delta * (a0_dd + ar_dd);

  const dP =
    R * T * term;

  return dP * 1e-6; // Pa → MPa
}

window.__pressureFromRho = pressureFromRho;
