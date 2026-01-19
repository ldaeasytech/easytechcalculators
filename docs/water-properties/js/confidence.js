// confidence.js
// Confidence / uncertainty estimation for displayed properties
// Informational only — does NOT affect calculations

/**
 * Estimate relative uncertainty for a property.
 *
 * @param {string} property - Canonical property name
 * @param {string} phase - Phase label (from solver / IF97)
 * @returns {{uncertainty_percent:number, confidence_band:string}}
 */
export function estimateConfidence(property, phase) {

  // Base uncertainties (%), conservative & defensible
  const baseUncertainty = {
    enthalpy: 0.2,
    entropy: 0.2,
    density: 0.5,
    specificVolume: 0.5,
    cp: 1.0,
    cv: 1.0,
    viscosity: 2.0,
    conductivity: 2.0
  };

  // Unknown / non-physical properties
  if (!baseUncertainty[property]) {
    return {
      uncertainty_percent: null,
      confidence_band: "—"
    };
  }

  let uncertainty = baseUncertainty[property];

  /* ------------------------------------------------------------
     Phase-based modifiers
     ------------------------------------------------------------ */

  if (phase === "two_phase") {
    // Two-phase values depend on mixture model
    uncertainty *= 2.0;
  }

  /* ------------------------------------------------------------
     Near-critical sensitivity (transport properties)
     ------------------------------------------------------------ */

  if (
    property === "viscosity" ||
    property === "conductivity"
  ) {
    uncertainty *= 1.5;
  }

  /* ------------------------------------------------------------
     Defensive clamp
     ------------------------------------------------------------ */

  uncertainty = Math.min(Math.max(uncertainty, 0.1), 10.0);

  return {
    uncertainty_percent: uncertainty,
    confidence_band: `±${uncertainty}%`
  };
}
