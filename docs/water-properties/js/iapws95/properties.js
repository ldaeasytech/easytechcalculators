import { R, Tc, rhoc } from "./constants95.js";
import { helmholtz } from "./derivatives.js";

export function properties(T, rho) {

  const h = helmholtz(T, rho, Tc, rhoc);

  const tau = h.tau;
  const delta = h.delta;

  const v = 1 / rho;

  // ----------------------------
  // Thermodynamic properties
  // ----------------------------

  const u =
    R * T * tau * (h.a0_t + h.ar_t);

  const h_spec =
    R * T * (
      1 +
      delta * h.ar_d +
      tau * (h.a0_t + h.ar_t)
    );

  const s =
    R * (
      tau * (h.a0_t + h.ar_t) -
      (h.a0 + h.ar)
    );

  const cv =
    -R * tau * tau * (h.a0_tt + h.ar_tt);

  const cp =
    cv +
    R *
      Math.pow(
        1 + delta * h.ar_d - delta * tau * h.ar_dt,
        2
      ) /
      (
        1 +
        2 * delta * h.ar_d +
        delta * delta * h.ar_dd
      );

  // ----------------------------
  // Unit conversion (J → kJ)
  // ----------------------------

  const J2kJ = 1e-3;

  return {
    density: rho,
    specificVolume: v,
    enthalpy: h_spec * J2kJ,
    entropy: s * J2kJ,
    internalEnergy: u * J2kJ,
    cp: cp * J2kJ,
    cv: cv * J2kJ
  };
}
