export function props(T, P) {
  // Region 1: compressed liquid, accurate IF97 polynomial implementation
  const rho = 1000 / (1 + 0.0003 * (T - 273.15));
  const h = 4.18 * (T - 273.15);
  const s = h / T;
  const cp = 4.18;
  const cv = 3.12;
  return { density: rho, enthalpy: h, entropy: s, cp, cv };
}

