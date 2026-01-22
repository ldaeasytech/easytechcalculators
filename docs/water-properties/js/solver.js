/********************************************************************
 * solver.js
 * Water Thermodynamics Calculator – IAPWS-IF97
 * Supported input modes:
 *   PT  → Pressure–Temperature
 *   Tx  → Temperature–Quality
 *   Px  → Pressure–Quality
 ********************************************************************/

export function solveState(inputs) {
  const mode = inputs.mode;

  if (!mode) {
    throw new Error("Input mode not specified.");
  }

  switch (mode) {
    case "PT":
      return solvePT(inputs);

    case "Tx":
      return solveTx(inputs);

    case "Px":
      return solvePx(inputs);

    default:
      throw new Error("Unsupported input mode.");
  }
}

/* ================================================================
 * P–T MODE
 * ================================================================ */
function solvePT({ P, T }) {
  if (P <= 0 || T <= 0) {
    throw new Error("Invalid pressure or temperature.");
  }

  // Saturation temperature at P
  const Tsat = region4_P_to_T(P);

  // --- Compressed / Subcooled Liquid ---
  if (T < Tsat) {
    const r1 = region1_PT(P, T);
    return formatResult(r1, P, T, null, "Region 1 (Subcooled Liquid)");
  }

  // --- Saturated Line ---
  if (Math.abs(T - Tsat) < 1e-6) {
    const satL = region1_PT(P, Tsat);
    const satV = region2_PT(P, Tsat);

    return {
      T,
      P,
      vf: satL.v,
      vg: satV.v,
      uf: satL.u,
      ug: satV.u,
      hf: satL.h,
      hg: satV.h,
      sf: satL.s,
      sg: satV.s,
      region: "Saturation Line"
    };
  }

  // --- Superheated Vapor ---
  if (T > Tsat && T <= 1073.15) {
    const r2 = region2_PT(P, T);
    return formatResult(r2, P, T, null, "Region 2 (Superheated Vapor)");
  }

  // --- High-temperature vapor ---
  if (T > 1073.15) {
    const r5 = region5_PT(P, T);
    return formatResult(r5, P, T, null, "Region 5 (High-T Vapor)");
  }

  throw new Error("State could not be resolved.");
}

/* ================================================================
 * T–x MODE
 * ================================================================ */
function solveTx({ T, x }) {
  if (x < 0 || x > 1) {
    throw new Error("Quality x must be between 0 and 1.");
  }

  const P = region4_T_to_P(T);

  const satL = region1_PT(P, T);
  const satV = region2_PT(P, T);

  const mix = mixProps(satL, satV, x);

  return {
    ...mix,
    T,
    P,
    x,
    region: "Two-phase (T–x)"
  };
}

/* ================================================================
 * P–x MODE  ✅ NEW
 * ================================================================ */
function solvePx({ P, x }) {
  if (x < 0 || x > 1) {
    throw new Error("Quality x must be between 0 and 1.");
  }

  if (P < 0.000611 || P > 22.064) {
    throw new Error("Pressure outside saturation limits.");
  }

  // Saturation temperature from Region 4
  const T = region4_P_to_T(P);

  // Saturated liquid & vapor
  const satL = region1_PT(P, T);
  const satV = region2_PT(P, T);

  const mix = mixProps(satL, satV, x);

  return {
    ...mix,
    T,
    P,
    x,
    region: "Two-phase (P–x)"
  };
}

/* ================================================================
 * Property mixing (quality-based)
 * ================================================================ */
function mixProps(f, g, x) {
  return {
    v: f.v + x * (g.v - f.v),
    u: f.u + x * (g.u - f.u),
    h: f.h + x * (g.h - f.h),
    s: f.s + x * (g.s - f.s)
  };
}

/* ================================================================
 * Output formatter
 * ================================================================ */
function formatResult(r, P, T, x, region) {
  return {
    T,
    P,
    v: r.v,
    u: r.u,
    h: r.h,
    s: r.s,
    x,
    region
  };
}
