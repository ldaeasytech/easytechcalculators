import { Psat } from "./region4.js";

// IF97 Region 2–3 boundary (official)
function T23(P) {
  return 623.15 + (P - 16.52916425) / 0.001;
}

export function regionSelector(T, P) {
  const Ps = Psat(T);

  // Region 5
  if (T > 1073.15 && P <= 50) return 5;

  // Region 2
  if (
    (T > 623.15 && T <= T23(P)) ||
    (T <= 623.15 && P < Ps)
  ) {
    return 2;
  }

  // Region 1
  if (T <= 623.15 && P > Ps) return 1;

  // Region 3
  return 3;
}
