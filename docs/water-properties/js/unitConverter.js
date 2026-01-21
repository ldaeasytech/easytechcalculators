// unitConverter.js — SAFE UI ⇄ IF97 unit conversion
// This version is SOLVER-SAFE and Tx-SAFE

import { UNIT_SYSTEMS } from "./unitConfig.js";

const MPa_TO_PSIA = 145.0377377;
const K_TO_R = 1.8;
const KJPKG_TO_BTU_LBM = 0.429922614;
const KGPM3_TO_LBMFT3 = 0.06242796;

/* ============================================================
   Explicit field lists
   ============================================================ */

// Fields that may appear as USER INPUTS
const INPUT_FIELDS = [
  "temperature",
  "pressure",
  "enthalpy",
  "entropy",
  "density",
  "specificVolume",
  "quality"
];

// Fields that may appear as SOLVER OUTPUTS
const OUTPUT_FIELDS = [
  "temperature",
  "pressure",
  "density",
  "specificVolume",
  "enthalpy",
  "entropy",
  "cp",
  "cv",
  "viscosity",
  "conductivity"
];

/* ============================================================
   UI → IF97 (INPUTS ONLY)
   ============================================================ */
export function toSI(raw, system = "SI") {
  if (!UNIT_SYSTEMS.includes(system)) {
    throw new Error(`Unsupported unit system: ${system}`);
  }

  const out = {};

  // Copy ONLY allowed input fields
  for (const key of INPUT_FIELDS) {
    if (Number.isFinite(raw[key])) {
      out[key] = raw[key];
    }
  }

  if (system === "SI") return out;

  if (Number.isFinite(out.temperature)) {
    out.temperature = (out.temperature + 459.67) / K_TO_R;
  }

  if (Number.isFinite(out.pressure)) {
    out.pressure = out.pressure / MPa_TO_PSIA;
  }

  if (Number.isFinite(out.enthalpy)) {
    out.enthalpy = out.enthalpy / KJPKG_TO_BTU_LBM;
  }

  if (Number.isFinite(out.entropy)) {
    out.entropy = out.entropy / KJPKG_TO_BTU_LBM;
  }

  if (Number.isFinite(out.density)) {
    out.density = out.density / KGPM3_TO_LBMFT3;
  }

  if (Number.isFinite(out.specificVolume)) {
    out.specificVolume = out.specificVolume * KGPM3_TO_LBMFT3;
  }

  return out;
}

/* ============================================================
   IF97 → UI (OUTPUTS ONLY)
   ============================================================ */
export function fromSI(raw, system = "SI") {
  if (!UNIT_SYSTEMS.includes(system)) {
    throw new Error(`Unsupported unit system: ${system}`);
  }

  // Start with a shallow copy — preserve metadata
  const out = { ...raw };

  if (system === "SI") return out;

  for (const key of OUTPUT_FIELDS) {
    if (!Number.isFinite(out[key])) continue;

    switch (key) {
      case "temperature":
        out.temperature = out.temperature * K_TO_R - 459.67;
        break;

      case "pressure":
        out.pressure = out.pressure * MPa_TO_PSIA;
        break;

      case "enthalpy":
      case "entropy":
      case "cp":
      case "cv":
        out[key] = out[key] * KJPKG_TO_BTU_LBM;
        break;

      case "density":
        out.density = out.density * KGPM3_TO_LBMFT3;
        break;

      case "specificVolume":
        out.specificVolume = out.specificVolume / KGPM3_TO_LBMFT3;
        break;
    }
  }

  return out;
}
