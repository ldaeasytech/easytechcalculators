export function props(T, P) {
  const rho = P / (461.5 * T);
  const h = 2500 + 1.9 * (T - 373.15);
  const s = h / T;
  const cp = 2.08;
  const cv = 1.54;
  return { density: rho, enthalpy: h, entropy: s, cp, cv };
}

