// regionSelector.js — IF97 region determination
// Returns 1, 2, 3, or 5

import { Psat } from "./region4.js";

export function regionSelector(T, P) {
  // Region 5: high-temperature steam
  if (T > 1073.15 && P <= 50.0) return 5;

  // Saturation boundary
  const Ps = Psat(T);

  // Region 2: superheated vapor
  if ((T > 623.15 && P <= 100.0) || (T <= 623.15 && P < Ps)) return 2;

  // Region 1: compressed liquid
  if (T <= 623.15 && P > Ps) return 1;

  // Region 3: dense fluid
  return 3;
}
