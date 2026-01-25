/* ============================================================
   solver.js
   Central dispatcher + iterative solvers for IF97 calculator
   ============================================================ */

import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region4 } from "./region4.js";

/* ------------------------------------------------------------
   Public entry point
------------------------------------------------------------ */
export function solve(mode, inputs) {
  const { P, T, h, s, x } = inputs;

  switch (mode) {
    case "TP":
      return solveTP(P, T);

    case "Tx":
      return solveTx(T, x);

    case "Px":
      return solvePx(P, x);

    case "Ph":
      return solvePh(P, h);

    case "Ps":
      return solvePs(P, s);

    default:
      throw new Error(`Unsupported solver mode: ${mode}`);
  }
}

/* ------------------------------------------------------------
   Direct solvers
------------------------------------------------------------ */
function solveTP(P, T) {
  const Tsat = region4.Tsat_P(P);

  if (T < Tsat) return region1(P, T);
  return region2(P, T);
}

function solveTx(T, x) {
  return region4.from_Tx(T, x);
}

function solvePx(P, x) {
  return region4.from_Px(P, x);
}

/* ------------------------------------------------------------
   Iterative solvers: P-h and P-s
------------------------------------------------------------ */
function solvePh(P, h) {
  const Tsat = region4.Tsat_P(P);

  const sat = region4.from_Px(P, 0.5);
  const hf = sat.hf;
  const hg = sat.hg;

  /* --- Two-phase region --- */
  if (h >= hf && h <= hg) {
    const x = (h - hf) / (hg - hf);
    return region4.from_Px(P, x);
  }

  /* --- Subcooled liquid --- */
  if (h < hf) {
    return iterateAtConstantP({
      P,
      target: h,
      property: "h",
      regionFn: region1,
      Tmin: 273.15,
      Tmax: Tsat
    });
  }

  /* --- Superheated vapor --- */
  return iterateAtConstantP({
    P,
    target: h,
    property: "h",
    regionFn: region2,
    Tmin: Tsat,
    Tmax: 1073.15
  });
}

function solvePs(P, s) {
  const Tsat = region4.Tsat_P(P);

  const sat = region4.from_Px(P, 0.5);
  const sf = sat.sf;
  const sg = sat.sg;

  /* --- Two-phase region --- */
  if (s >= sf && s <= sg) {
    const x = (s - sf) / (sg - sf);
    return region4.from_Px(P, x);
  }

  /* --- Subcooled liquid --- */
  if (s < sf) {
    return iterateAtConstantP({
      P,
      target: s,
      property: "s",
      regionFn: region1,
      Tmin: 273.15,
      Tmax: Tsat
    });
  }

  /* --- Superheated vapor --- */
  return iterateAtConstantP({
    P,
    target: s,
    property: "s",
    regionFn: region2,
    Tmin: Tsat,
    Tmax: 1073.15
  });
}

/* ------------------------------------------------------------
   Generic bisection iterator at constant pressure
------------------------------------------------------------ */
function iterateAtConstantP({
  P,
  target,
  property,
  regionFn,
  Tmin,
  Tmax,
  maxIter = 50,
  tol = 1e-6
}) {
  let Tlow = Tmin;
  let Thigh = Tmax;
  let result = null;

  for (let i = 0; i < maxIter; i++) {
    const Tmid = 0.5 * (Tlow + Thigh);
    result = regionFn(P, Tmid);

    const value = result[property];
    const error = value - target;

    if (Math.abs(error) < tol) break;

    if (error > 0) Thigh = Tmid;
    else Tlow = Tmid;
  }

  return result;
}
