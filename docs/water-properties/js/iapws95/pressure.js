import { R, Tc, rhoc } from "./constants95.js";
import { helmholtz } from "./derivatives.js";

// Pressure in MPa
export function pressure(T, rho) {
  const h = helmholtz(T, rho, Tc, rhoc);
  return rho * R * T * (1 + h.delta * h.ar_d) * 1e-3;
}

export function dPdrho(T, rho) {
  const h = helmholtz(T, rho, Tc, rhoc);
  const term =
    1 + 2 * h.delta * h.ar_d + h.delta * h.delta * h.ar_dd;

  return R * T * term * 1e-3;
}
