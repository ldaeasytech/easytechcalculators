// unitConverter.js
// UI ⇄ IF97 unit conversion

import { UNIT_SYSTEMS } from "./unitConfig.js";

const MPa_TO_PSIA = 145.0377377;
const K_TO_R = 1.8;
const KJPKG_TO_BTU_LBM = 0.429922614;
const KGPM3_TO_LBMFT3 = 0.06242796;

/* ============================================================
   UI → IF97
   ============================================================ */
export function toSI(raw, system = "SI") {
  if (!UNIT_SYSTEMS.includes(system)) {
    throw new Error(`Unsupported unit system: ${system}`);
  }

  const out = { ...raw };

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
   IF97 → UI
   ============================================================ */
export function fromSI(raw, system = "SI") {
  if (!UNIT_SYSTEMS.includes(system)) {
    throw new Error(`Unsupported unit system: ${system}`);
  }

  const out = { ...raw };

  if (system === "SI") return out;

  if (Number.isFinite(out.temperature)) {
    out.temperature = out.temperature * K_TO_R - 459.67;
  }

  if (Number.isFinite(out.pressure)) {
    out.pressure = out.pressure * MPa_TO_PSIA;
  }

  if (Number.isFinite(out.enthalpy)) {
    out.enthalpy = out.enthalpy * KJPKG_TO_BTU_LBM;
  }

  if (Number.isFinite(out.entropy)) {
    out.entropy = out.entropy * KJPKG_TO_BTU_LBM;
  }

  if (Number.isFinite(out.density)) {
    out.density = out.density * KGPM3_TO_LBMFT3;
  }

  if (Number.isFinite(out.specificVolume)) {
    out.specificVolume = out.specificVolume / KGPM3_TO_LBMFT3;
  }

  return out;
}
