export function props(T, P) {
  return {
    density: P / (461.5 * T),
    enthalpy: 3000 + 2.5 * (T - 1000),
    entropy: 6 + 0.005 * (T - 1000),
    cp: 2.3,
    cv: 1.9
  };
}

