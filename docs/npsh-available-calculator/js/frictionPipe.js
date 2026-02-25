// js/frictionPipe.js

export function reynoldsNumber(rho, D, v, mu) {
  return (rho * D * v) / mu;
}

export function frictionFactor(Re, e, D) {
  // Laminar
  if (Re < 2100) {
    return 16 / Re;
  }

  // Turbulent
  if (Re > 4100) {
    const Rs =
      -4 * Math.log10(0.27 * e / D + Math.pow(7 / Re, 0.9));
    return 1 / (Rs * Rs);
  }

  // Transition
  const A = Math.pow(
    2.457 * Math.log(1 / (Math.pow(7 / Re, 0.9) + 0.27 * e / D)),
    16
  );
  const B = Math.pow(37530 / Re, 16);

  return 2 * Math.pow(
    Math.pow(8 / Re, 12) + 1 / Math.pow(A + B, 1.5),
    1 / 12
  );
}

export function K_pipe({ rho, mu, D, v, L, e }) {
  const Re = reynoldsNumber(rho, D, v, mu);
  const f = frictionFactor(Re, e, D);
  return 4 * f * (L / D);
}
