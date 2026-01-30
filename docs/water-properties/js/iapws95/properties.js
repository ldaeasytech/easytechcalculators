// iapws95/properties.js
// Thermodynamic properties from IAPWS-95 Helmholtz EOS
// CONSISTENT WITH CURRENT DERIVATIVES (δ-derivatives only)

import { R, Tc, rhoc } from "./constants95.js";
import { helmholtz } from "./derivatives.js";

export function properties(T, rho) {

  const H = helmholtz(T, rho, Tc, rhoc);

  const delta = H.delta;
  const tau   = H.tau;

  const v = 1 / rho;

  // -------------------------------------------------
  // SAFE, WELL-DEFINED PROPERTIES
  // -------------------------------------------------

  // Pressure-related quantities handled elsewhere

  // -------------------------------------------------
  // PLACEHOLDERS (τ-derivatives not yet implemented)
  // -------------------------------------------------

  const unavailable = null;

  return {
    density: rho,
    specificVolume: v,

    // Thermodynamic properties (not yet enabled)
    internalEnergy: unavailable,
    enthalpy: unavailable,
    entropy: unavailable,
    cp: unavailable,
    cv: unavailable
  };
}
