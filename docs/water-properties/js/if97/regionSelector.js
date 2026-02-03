import { Psat } from "./region4.js";

/*
  Custom region logic (NOT strict IF97):

  Region 4 (saturation):
    273.16 K ≤ T ≤ 647.1 K
    P = Psat(T)

  Region 1 (compressed liquid):
    300 K ≤ T ≤ 1200 K
    0.1 MPa ≤ P ≤ 1000 MPa
    P > Psat(T)

  Region 2 (superheated vapor):
    372.76 K ≤ T ≤ 1200 K
    0.1 MPa ≤ P ≤ 10 MPa
    P < Psat(T)
*/

export function regionSelector(T, P) {
  const Ps = Psat(T);

  // ---------- Region 4: Saturation ----------
  if (
    T >= 273.16 &&
    T <= 647.1 &&
    Math.abs(P - Ps) < 1e-6
  ) {
    return 4;
  }

  // ---------- Region 1: Compressed liquid ----------
  if (
    T >= 300 &&
    T <= 1200 &&
    P >= 0.1 &&
    P <= 1000 &&
    P > Ps
  ) {
    return 1;
  }

  // ---------- Region 2: Superheated vapor ----------
  if (
    T >= 372.76 &&
    T <= 1200 &&
    P >= 0.1 &&
    P <= 10 &&
    P < Ps
  ) {
    return 2;
  }

  // ---------- Out of range ----------
  throw new Error(
    `State outside supported regions: T=${T} K, P=${P} MPa`
  );
}
