// confidence.js
// Confidence / uncertainty estimation (informational only)

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

  if (!(property in base)) {
    return { uncertainty_percent: null, confidence_band: "—" };
  }

  let u = base[property];

  if (phase === "two_phase") {
    u *= 2;
  }

  if (property === "viscosity" || property === "conductivity") {
    u *= 1.5;
  }

  u = Math.min(Math.max(u, 0.1), 10);

  return {
    uncertainty_percent: u,
    confidence_band: `±${u}%`
  };
}
