// regionSelector.js — unified region selection
// Supports TP, Ph, Ps without satProps.js

import { Psat, Tsat } from "./region4.js";
import {
  h_f_sat,
  h_g_sat,
  s_f_sat,
  s_g_sat
} from "./region4.js";

const T_CRIT = 647.1;
const P_CRIT = 22.064;

const H_TOL = 1e-6;
const S_TOL = 1e-6;

export function regionSelector({ T, P, h, s, mode }) {

  /* ==================================================
     P–h MODE (enthalpy-based, saturation first)
     ================================================== */
  if (mode === "Ph") {

    if (P > P_CRIT) return 1; // compressed liquid only

    const Ts = Tsat(P);
    const hf = h_f_sat(Ts);
    const hg = h_g_sat(Ts);

   // if (Math.abs(h - hf) < H_TOL) return 4;
   // if (Math.abs(h - hg) < H_TOL) return 4;

    if (h < hf) return 1;
    if (h > hg) return 2;

   // return 4; // two-phase
  }

  /* ==================================================
     P–s MODE (entropy-based, saturation first)
     ================================================== */
  if (mode === "Ps") {

    if (P > P_CRIT) return 1;

    const Ts = Tsat(P);
    const sf = s_f_sat(Ts);
    const sg = s_g_sat(Ts);

   // if (Math.abs(s - sf) < S_TOL) return 4;
   // if (Math.abs(s - sg) < S_TOL) return 4;

    if (s < sf) return 1;
    if (s > sg) return 2;

   // return 4;
  }

  /* ==================================================
     T–P MODE (TP, Tx, Px)
     ================================================== */

  if (T > T_CRIT) {
    if (P <= 10) return 2;
    return 1;
  }

  const Ps = Psat(T);

  if (Math.abs(P - Ps) < 1e-6) return 4;
  if (P > Ps) return 1;
  return 2;
}
