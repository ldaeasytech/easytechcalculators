import { Psat } from "./region4.js";

const T_CRIT = 647.1;

export function regionSelector(T, P) {

  // =========================
  // Above critical temperature
  // =========================
  if (T > T_CRIT) {
    if (
      T >= 372.76 &&
      T <= 1200 &&
      P >= 0.1 &&
      P <= 10
    ) {
      return 2; // superheated vapor (engineering sense)
    }

    if (
      T >= 300 &&
      T <= 1200 &&
      P > 10 &&
      P <= 1000
    ) {
      return 1; // compressed fluid (engineering sense)
    }

    throw new Error(
      `State outside supported regions: T=${T} K, P=${P} MPa`
    );
  }

  // =========================
  // Below / at critical temperature
  // =========================
  const Ps = Psat(T);

  // Region 4: saturation
  if (
    T >= 273.16 &&
    T <= T_CRIT &&
    Math.abs(P - Ps) < 1e-6
  ) {
    return 4;
  }

  // Region 1: compressed liquid
  if (
    T >= 300 &&
    T <= T_CRIT &&
    P >= 0.1 &&
    P <= 1000 &&
    P > Ps
  ) {
    return 1;
  }

  // Region 2: superheated vapor
  if (
    T >= 372.76 &&
    T <= T_CRIT &&
    P >= 0.1 &&
    P <= 10 &&
    P < Ps
  ) {
    return 2;
  }

  throw new Error(
    `State outside supported regions: T=${T} K, P=${P} MPa`
  );
}
