// region4.js — IF97 Saturation Line

import { EPS } from "./constants.js";

export function Psat(T) {
  const theta = T + n[8] / (T - n[9]);

  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];

  const disc = Math.max(B * B - 4 * A * C, EPS);

  return Math.pow((2 * C) / (-B + Math.sqrt(disc)), 4);
}
