// iapws95/properties.js
// Thermodynamic properties from full IAPWS-95 Helmholtz EOS

import { R, Tc, rhoc } from "./constants95.js";
import { helmholtz } from "./derivatives.js";

export function properties(T, rho) {

  const H = helmholtz(T, rho, Tc, rhoc);

  const tau = H.tau;
  const delta = H.delta;

  const v = 1 / rho;

  // ----------------------------
  // Thermodynamic properties
  // ----------------------------

  // Internal energy [J/kg]
  const u =
    R * T * tau * (H.a0_t + H.ar_t);

  // Enthalpy [J/kg]
  const h_spec =
    R * T * (
      1 +
      delta * (H.a0_d + H.ar_d) +
      tau * (H.a0_t + H.ar_t)
    );

  // Entropy [J/(kg·K)]
  const s =
    R * (
      tau * (H.a0_t + H.ar_t) -
      (H.a0 + H.ar)
    );

  // Isochoric heat capacity [J/(kg·K)]
  const cv =
    -R * tau * tau * (H.a0_tt + H.ar_tt);

  // Isobaric heat capacity [J/(kg·K)]
  const cp =
    cv +
    R *
      Math.pow(
        1 +
        delta * (H.a0_d + H.ar_d) -
        delta * tau * H.ar_dt,
        2
      ) /
      (
        1 +
        2 * delta * (H.a0_d + H.ar_d) +
        delta * delta * (H.a0_dd + H.ar_dd)
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
