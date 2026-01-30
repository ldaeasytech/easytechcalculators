// iapws95/pressure.js
// Pressure from full IAPWS-95 Helmholtz EOS
// WITH DEBUG CONSOLE OUTPUT

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

  const factor = 1 + delta * ar_d;
  const P_Pa = rho * R * T * factor;
  const P_MPa = P_Pa * 1e-6;

  // 🔍 DEBUG OUTPUT (GUARANTEED TO RUN)
  console.log(
    "[pressureFromRho]",
    {
      T,
      rho,
      delta,
      tau,
      ar_d,
      factor,
      P_MPa
    }
  );

  return P_MPa;
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

  const dP_Pa = R * T * term;
  const dP_MPa = dP_Pa * 1e-6;

  // 🔍 DEBUG OUTPUT
  console.log(
    "[dPdrho]",
    {
      T,
      rho,
      delta,
      tau,
      ar_d,
      ar_dd,
      term,
      dP_MPa
    }
  );

  return dP_MPa;
}
