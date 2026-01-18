// IAPWS-IF97 Region 4 (saturation line)
// Valid for: 273.15 K ≤ T ≤ 647.096 K
// Pressure in MPa, Temperature in K

const n = [
  0.11670521452767e4,
 -0.72421316703206e6,
 -0.17073846940092e2,
  0.12020824702470e5,
 -0.32325550322333e7,
  0.14915108613530e2,
 -0.48232657361591e4,
  0.40511340542057e6,
 -0.23855557567849,
  0.65017534844798e3
];

/**
 * Saturation pressure as function of temperature
 * @param {number} T - Temperature [K]
 * @returns {number} P - Saturation pressure [MPa]
 */
export function Psat(T) {
  const theta = T + n[8] / (T - n[9]);

  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];

  return Math.pow(
    (2 * C) / (-B + Math.sqrt(B * B - 4 * A * C)),
    4
  );
}

/**
 * Saturation temperature as function of pressure
 * @param {number} P - Pressure [MPa]
 * @returns {number} T - Saturation temperature [K]
 */
export function Tsat(P) {
  const beta = Math.pow(P, 0.25);

  const E = beta * beta + n[2] * beta + n[5];
  const F = n[0] * beta * beta + n[3] * beta + n[6];
  const G = n[1] * beta * beta + n[4] * beta + n[7];

  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));

  return (
    n[9] +
    D -
    Math.sqrt(
      (n[9] + D) * (n[9] + D) -
      4 * (n[8] + n[9] * D)
    )
  ) / 2;
}
