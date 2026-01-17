export function estimateConfidence(property, phase) {
  const base = {
    enthalpy: 0.2,
    entropy: 0.2,
    density: 0.5,
    specificVolume: 0.5,
    cp: 1.0,
    cv: 1.0,
    viscosity: 2.0,
    conductivity: 2.0
  };

  let uncertainty = base[property] || 1.0;

  if (phase === "saturated") uncertainty *= 1.5;
  if (phase === "ice") uncertainty *= 2.0;

  return {
    uncertainty_percent: uncertainty,
    confidence_band: `±${uncertainty}%`
  };
}

