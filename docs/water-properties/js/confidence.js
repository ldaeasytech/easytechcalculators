// confidence.js
// Confidence / uncertainty estimation for displayed properties
// NOTE: Informational only — not used in calculations

/**
 * Estimate relative uncertainty for a property.
 *
 * @param {string} property - Property name
 * @param {string} phase - Phase label from IF97 ("single-phase", "two-phase", etc.)
 * @returns {object}
 */
export function estimateConfidence(property, phase) {
  // Base uncertainties (%), conservative and defensible
  const baseUncertainty = {
    enthalpy: 0.2,
    entropy: 0.2,
    density: 0.5,
    specificVolume: 0.5,
    cp: 1.0,
    cv: 1.0,
    viscosity: 2.0,
    thermalConductivity: 2.0
  };

  let uncertainty = baseUncertainty[property] ?? 1.0;

  /* ------------------------------------------------------------
     Phase-based modifiers
     ------------------------------------------------------------ */

  if (phase === "two-phase") {
    // Transport properties not strictly defined in two-phase
    uncertainty *= 2.0;
  }

  /* ------------------------------------------------------------
     Critical-region awareness (soft, no hard detection)
     ------------------------------------------------------------ */

  if (
    property === "viscosity" ||
    property === "thermalConductivity"
  ) {
    // Critical enhancement is physically correct but sensitive
    uncertainty *= 1.5;
  }

  /* ------------------------------------------------------------
     Final clamp (defensive)
     ------------------------------------------------------------ */

  uncertainty = Math.min(Math.max(uncertainty, 0.1), 10.0);

  return {
    uncertainty_percent: uncertainty,
    confidence_band: `±${uncertainty}%`
  };
}
