import { Psat } from "./region4.js";
import {
  hSatLiquid,
  hSatVapor,
  sSatLiquid,
  sSatVapor
} from "./satProps.js";

const T_CRIT = 647.1;
const P_CRIT = 22.064;

const H_TOL = 1e-6;
const S_TOL = 1e-6;

export function regionSelector({ T, P, h, s, mode }) {

  // ==================================================
  // P–h MODE
  // ==================================================
  if (mode === "Ph") {

    if (P > P_CRIT) return 1;

    const h_f = hSatLiquid(P);
    const h_g = hSatVapor(P);

    if (Math.abs(h - h_f) < H_TOL) return 4;
    if (Math.abs(h - h_g) < H_TOL) return 4;

    if (h < h_f) return 1;
    if (h > h_g) return 2;

    if (h > h_f && h < h_g) return 4;

    throw new Error(`Invalid P–h state: P=${P} MPa, h=${h} kJ/kg`);
  }

  // ==================================================
  // P–s MODE
  // ==================================================
  if (mode === "Ps") {

    if (P > P_CRIT) return 1;

    const s_f = sSatLiquid(P);
    const s_g = sSatVapor(P);

    if (Math.abs(s - s_f) < S_TOL) return 4;
    if (Math.abs(s - s_g) < S_TOL) return 4;

    if (s < s_f) return 1;
    if (s > s_g) return 2;

    if (s > s_f && s < s_g) return 4;

    throw new Error(`Invalid P–s state: P=${P} MPa, s=${s} kJ/kg-K`);
  }

  // ==================================================
  // EXISTING T–P BASED MODES (TP, Tx, Px)
  // ==================================================

  if (T > T_CRIT) {

    if (
      T >= 372.76 &&
      T <= 1200 &&
      P >= 0.1 &&
      P <= 10
    ) return 2;

    if (
      T >= 300 &&
      T <= 1200 &&
      P > 10 &&
      P <= 1000
    ) return 1;

    throw new Error(
      `State outside supported regions: T=${T} K, P=${P} MPa`
    );
  }

  const Ps = Psat(T);

  if (
    T >= 273.16 &&
    T <= T_CRIT &&
    Math.abs(P - Ps) < 1e-6
  ) return 4;

  if (
    T >= 300 &&
    T <= T_CRIT &&
    P > Ps
  ) return 1;

  if (
    T >= 372.76 &&
    T <= T_CRIT &&
    P < Ps
  ) return 2;

  throw new Error(
    `State outside supported regions: T=${T} K, P=${P} MPa`
  );
}
