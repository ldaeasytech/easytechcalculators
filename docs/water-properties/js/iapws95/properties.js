import { R, Tc, rhoc } from "./constants95.js";
import { helmholtz } from "./derivatives.js";

export function properties(T, rho) {
  const h = helmholtz(T, rho, Tc, rhoc);

  const v = 1 / rho;

  const u =
    R * T * (h.a0_t + h.ar_t);

  const h_spec =
    R * T * (1 + h.delta * h.ar_d + h.a0_t + h.ar_t);

  const s =
    R * (h.a0_t + h.ar_t - h.a0 - h.ar);

  const cv =
    -R * (h.a0_tt + h.ar_tt);

  const cp =
    cv + R * Math.pow(
      1 + h.delta * h.ar_d - h.delta * h.tau * h.ar_t,
      2
    ) /
    (1 + 2 * h.delta * h.ar_d + h.delta * h.delta * h.ar_dd);

  return {
    density: rho,
    specificVolume: v,
    enthalpy: h_spec,
    entropy: s,
    internalEnergy: u,
    cp,
    cv
  };
}

