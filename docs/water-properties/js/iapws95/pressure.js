// iapws95/pressure.js
// Pressure and derivative from IAPWS-95 Helmholtz EOS

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
 * Pressure P [MPa] from density rho [kg/m^3] and temperature T [K]
 */
export function pressureFromRho(T, rho) {
  if (rho <= 0 || !Number.isFinite(rho)) {
    throw new Error("Non-physical density in pressureFromRho");
  }

  const delta = rho / rhoc;
  const tau = Tc / T;

  const ar_d = alphar_delta(delta, tau);

  // IAPWS-95 pressure equation
  const P =
    rho * R * T * (1 + delta * ar_d);

  // Convert Pa → MPa
  return P * 1e-6;
}

/**
 * ∂P/∂rho at constant T [MPa·m^3/kg]
 */
export function dPdrho(T, rho) {
  if (rho <= 0 || !Number.isFinite(rho)) {
    throw new Error("Non-physical density in dPdrho");
  }

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

  // Convert Pa·m³/kg → MPa·m³/kg
  return dP * 1e-6;
}
