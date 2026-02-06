// unitConverter.js — SAFE UI ⇄ IF97 unit conversion
// Uses unitSets as the single source of truth

import { unitSets } from "./unitConfig.js";

/* ============================================================
   INPUT → SI (solver side)
   ============================================================ */
export function toSI(raw, system = "SI") {
  const out = { ...raw };

  if (system === "SI") return out;

  for (const key in raw) {
    if (!Number.isFinite(raw[key])) continue;

    const unitDef = unitSets[key]?.[system]?.[0];
    if (!unitDef?.toSI) continue;

    out[key] = unitDef.toSI(raw[key]);
  }

  return out;
}

/* ============================================================
   SI → OUTPUT (UI side)
   ============================================================ */
export function fromSI(raw, system = "SI") {
  const out = { ...raw };

  if (system === "SI") return out;

  for (const key in raw) {
    if (!Number.isFinite(raw[key])) continue;

    const unitDef = unitSets[key]?.[system]?.[0];
    if (!unitDef?.fromSI) continue;

    out[key] = unitDef.fromSI(raw[key]);
  }

  return out;
}
