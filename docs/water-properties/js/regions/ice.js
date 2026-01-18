export function compute(T, P) {
  return {
    density: 917,
    specificVolume: 1 / 917,
    enthalpy: 2.05 * (T - 273.15),
    entropy: (2.05 * (T - 273.15)) / T,
    cp: 2.05,
    cv: 1.8,
    viscosity: 1e12,
    conductivity: 2.2
  };
}

