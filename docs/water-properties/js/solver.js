/**
 * solver.js
 * Main thermodynamic solver for water/steam properties
 * Based on IAPWS-IF97 (simplified engineering correlations)
 */

import { fusionHeat } from "./fusionHeat.js";
import { vaporizationHeat } from "./vaporizationHeat.js";
import { sublimationHeat } from "./sublimationHeat.js";

/**
 * Compute thermodynamic properties given T (°C) and P (kPa)
 * Returns properties in SI engineering units
 */
export function computeProperties(T_C, P_kPa, phase = "auto") {
  const T = T_C + 273.15; // K
  const P = P_kPa * 1000; // Pa

  // Saturation temperature approximation (Antoine eq, water)
  const Tsat = saturationTemperature(P_kPa);

  let region;
  if (phase === "liquid") region = "liquid";
  else if (phase === "vapor") region = "vapor";
  else if (phase === "ice") region = "ice";
  else {
    if (T_C < 0) region = "ice";
    else if (Math.abs(T_C - Tsat) < 0.5) region = "saturated";
    else if (T_C < Tsat) region = "liquid";
    else region = "vapor";
  }

  let rho, v, h, s, cp, cv, mu, k;

  if (region === "liquid") {
    rho = liquidDensity(T_C);
    cp = liquidCp(T_C);
    cv = cp - 0.1;
    h = liquidEnthalpy(T_C);
    s = liquidEntropy(T_C);
    mu = liquidViscosity(T_C);
    k = liquidThermalConductivity(T_C);
  } else if (region === "vapor") {
    rho = vaporDensity(T, P);
    cp = vaporCp(T_C);
    cv = cp - 0.287;
    h = vaporEnthalpy(T_C);
    s = vaporEntropy(T, P);
    mu = vaporViscosity(T_C);
    k = vaporThermalConductivity(T_C);
  } else if (region === "ice") {
    rho = iceDensity(T_C);
    cp = iceCp(T_C);
    cv = cp;
    h = iceEnthalpy(T_C);
    s = iceEntropy(T_C);
    mu = NaN;
    k = iceThermalConductivity(T_C);
  } else if (region === "saturated") {
    const hf = liquidEnthalpy(T_C);
    const hg = hf + vaporizationHeat(T);
    h = hg;
    s = vaporEntropy(T, P);
    rho = vaporDensity(T, P);
    cp = vaporCp(T_C);
    cv = cp - 0.287;
    mu = vaporViscosity(T_C);
    k = vaporThermalConductivity(T_C);
  }

  v = 1 / rho;

  return {
    density: rho,
    specificVolume: v,
    enthalpy: h,
    entropy: s,
    cp: cp,
    cv: cv,
    viscosity: mu,
    thermalConductivity: k,
    region: region,
  };
}

/* ---------- Supporting property correlations ---------- */

// Saturation temperature (°C) from pressure (kPa)
function saturationTemperature(P_kPa) {
  const A = 8.07131;
  const B = 1730.63;
  const C = 233.426;
  const P_mmHg = P_kPa * 7.50062;
  const Tsat = B / (A - Math.log10(P_mmHg)) - C;
  return Tsat;
}

/* Liquid properties */

function liquidDensity(T_C) {
  return 1000 - 0.07 * (T_C - 4);
}

function liquidCp(T_C) {
  return 4.18 + 0.001 * (T_C - 25);
}

function liquidEnthalpy(T_C) {
  return 4.18 * T_C;
}

function liquidEntropy(T_C) {
  return 4.18 * Math.log((T_C + 273.15) / 273.15);
}

function liquidViscosity(T_C) {
  return 1e-3 * Math.exp(247.8 / (T_C + 273.15 - 140));
}

function liquidThermalConductivity(T_C) {
  return 0.561 + 0.0017 * (T_C - 20);
}

/* Vapor properties */

function vaporDensity(T_K, P_Pa) {
  const R = 461.5;
  return P_Pa / (R * T_K);
}

function vaporCp(T_C) {
  return 1.996 + 0.0002 * (T_C - 100);
}

function vaporEnthalpy(T_C) {
  return 2500 + 1.9 * T_C;
}

function vaporEntropy(T_K, P_Pa) {
  const R = 461.5;
  const s_ref = 7.354;
  return s_ref + R * Math.log(T_K / 373.15) - R * Math.log(P_Pa / 101325);
}

function vaporViscosity(T_C) {
  return 1e-5 * (1 + 0.003 * T_C);
}

function vaporThermalConductivity(T_C) {
  return 0.025 + 0.00007 * T_C;
}

/* Ice properties */

function iceDensity(T_C) {
  return 917 - 0.1 * T_C;
}

function iceCp(T_C) {
  return 2.05 + 0.005 * T_C;
}

function iceEnthalpy(T_C) {
  return iceCp(T_C) * T_C;
}

function iceEntropy(T_C) {
  return iceCp(T_C) * Math.log((T_C + 273.15) / 273.15);
}

function iceThermalConductivity(T_C) {
  return 2.2 - 0.01 * T_C;
}
