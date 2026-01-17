export function compute(T, P) {
  return {
    density: densityVapor(T, P),
    specificVolume: 1 / densityVapor(T, P),
    enthalpy: enthalpyVapor(T),
    entropy: entropyVapor(T, P),
    cp: 2.08,
    cv: 1.54,
    viscosity: 1.3e-5,
    conductivity: 0.03
  };
}

export function densityVapor(T, P) {
  return P / (461.5 * T);
}

export function enthalpyVapor(T) {
  return 2500 + 1.9 * (T - 373.15);
}

export function entropyVapor(T, P) {
  return enthalpyVapor(T) / T;
}

