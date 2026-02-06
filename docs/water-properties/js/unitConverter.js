// unitConverter.js
// Per-property unit conversion (solver-safe)

import { UNIT_OPTIONS } from "./unitConfig.js";

/* ============================================================
   UI → SI
   ============================================================ */

export function toSI(raw, selectedUnits) {
  const out = {};

  for (const key in raw) {
    const val = raw[key];
    if (!Number.isFinite(val)) continue;

    const unitName = selectedUnits[key];
    const options =
      UNIT_OPTIONS[key]?.SI?.concat(UNIT_OPTIONS[key]?.Imperial) ?? [];

    const u = options.find(o => o.unit === unitName);
    if (!u) throw new Error(`Unsupported unit ${unitName} for ${key}`);

    out[key] = u.toSI(val);
  }

  return out;
}

/* ============================================================
   SI → UI
   ============================================================ */

export function fromSI(raw, selectedUnits) {
  const out = { ...raw };

  for (const key in raw) {
    const val = raw[key];
    if (!Number.isFinite(val)) continue;

    const unitName = selectedUnits[key];
    const options =
      UNIT_OPTIONS[key]?.SI?.concat(UNIT_OPTIONS[key]?.Imperial) ?? [];

    const u = options.find(o => o.unit === unitName);
    if (!u) continue;

    out[key] = u.fromSI(val);
  }

  return out;
}
