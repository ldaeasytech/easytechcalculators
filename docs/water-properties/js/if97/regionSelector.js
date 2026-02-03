import { Psat } from "./region4.js";

export function regionSelector(T, P) {
  const Ps = Psat(T);

  // ---------- Region 5 ----------
  if (T > 1073.15 && T <= 2273.15 && P <= 50) {
    return 5;
  }

  // ---------- Region 2 (superheated vapor) ----------
  if (
    (T > 623.15 && P <= 100 && T <= T23(P)) ||
    (T <= 623.15 && P < Ps)
  ) {
    return 2;
  }

  // ---------- Region 1 (compressed liquid) ----------
  if (T <= 623.15 && P >= Ps) {
    return 1;
  }

  // ---------- Region 3 (high-density fluid) ----------
  return 3;
}
