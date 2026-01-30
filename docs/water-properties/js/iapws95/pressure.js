// iapws95/pressure.js
// Pressure from full IAPWS-95 Helmholtz EOS (CORRECT)

import { Tc, rhoc, R } from "./constants95.js";
import {
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

  const ar_d = alphar_delta(delta, tau);

  // IAPWS-95 correct pressure equation
  const P = rho * R * T * (1 + delta * ar_d);

  return P * 1e-6; // Pa → MPa
}

/**
 * ∂P/∂ρ at constant T [MPa·m³/kg]
 */
export function dPdrho(T, rho) {
  const delta = rho / rhoc;
  const tau = Tc / T;

  const ar_d  = alphar_delta(delta, tau);
  const ar_dd = alphar_deltadelta(delta, tau);

  const term =
    1 +
    2 * delta * ar_d +
    delta * delta * ar_dd;

  const dP = R * T * term;

  return dP * 1e-6; // Pa → MPa
}

// optional console access
window.__pressureFromRho = pressureFromRho;
