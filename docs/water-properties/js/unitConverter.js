// unitConverter.js
// UI ⇄ IF97 unit conversion (SAFE MINIMAL VERSION)
// Internal IF97 units:
//   temperature → K
//   pressure    → MPa

const K_TO_R = 1.8;
const MPa_TO_PSIA = 145.0377377;

/* ============================================================
   UI → IF97
   ============================================================ */

export function toSI(raw, system) {
  const out = { ...raw };

  // Normalize naming (T,P → temperature,pressure)
  if (out.T !== undefined) out.temperature = out.T;
  if (out.P !== undefined) out.pressure = out.P;

  // SI mode: already correct
  if (system === "SI") {
    return out;
  }

  // Imperial → SI
  if (Number.isFinite(out.temperature)) {
    out.temperature = (out.temperature + 459.67) / K_TO_R;
  }

  if (Number.isFinite(out.pressure)) {
    out.pressure = out.pressure / MPa_TO_PSIA; // psia → MPa
  }

  return out;
}

/* ============================================================
   IF97 → UI
   ============================================================ */

export function fromSI(raw, system) {
  const out = { ...raw };

  // Preserve aliases for UI
  if (out.temperature !== undefined) out.T = out.temperature;
  if (out.pressure !== undefined) out.P = out.pressure;

  if (system === "SI") {
    return out;
  }

  if (Number.isFinite(out.temperature)) {
    out.temperature = out.temperature * K_TO_R - 459.67;
  }

  if (Number.isFinite(out.pressure)) {
    out.pressure = out.pressure * MPa_TO_PSIA;
  }

  return out;
}
