export function compute(T, P) {
  return {
    density: densityLiquid(T),
    specificVolume: 1 / densityLiquid(T),
    enthalpy: enthalpyLiquid(T),
    entropy: entropyLiquid(T),
    cp: 4.18,
    cv: 3.12,
    viscosity: 1e-3,
    conductivity: 0.6
  };
}

export function densityLiquid(T) {
  return 1000 / (1 + 0.0003 * (T - 273.15));
}

export function enthalpyLiquid(T) {
  return 4.18 * (T - 273.15);
}

export function entropyLiquid(T) {
  return enthalpyLiquid(T) / T;
}

