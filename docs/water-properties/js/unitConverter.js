// unitConverter.js
// Converts between UI units and internal IF97 units
// INTERNAL UNITS (STRICT):
//   T  → K
//   P  → MPa
//   h  → kJ/kg
//   s  → kJ/(kg·K)

const K_TO_R = 1.8;
const MPa_TO_PSIA = 145.0377377;

const KJKG_TO_BTULBM = 0.429922614;
const M3KG_TO_FT3LBM = 16.018463;
const KG_M3_TO_LBM_FT3 = 0.06242796;
const PA_S_TO_LBM_FT_S = 0.020885434;
const W_MK_TO_BTUPH_FT_R = 0.577789;

/* ============================================================
   Convert UI → Internal (SI / IF97)
   ============================================================ */
// Normalize IF97 aliases
if (inputs.T !== undefined) inputs.temperature = inputs.T;
if (inputs.P !== undefined) inputs.pressure = inputs.P;
if (inputs.h !== undefined) inputs.enthalpy = inputs.h;
if (inputs.s !== undefined) inputs.entropy = inputs.s;

export function toSI(inputs, system) {

  // SI mode: values are ALREADY in IF97 units
  if (system === "SI") {
    return { ...inputs };
  }

  // English / Imperial → IF97
  const out = { ...inputs };

  if (!isNaN(out.temperature))
    out.temperature = (out.temperature + 459.67) / K_TO_R;

  // psia → MPa
  if (!isNaN(out.pressure))
    out.pressure = out.pressure / MPa_TO_PSIA;

  if (!isNaN(out.enthalpy))
    out.enthalpy = out.enthalpy / KJKG_TO_BTULBM;

  if (!isNaN(out.entropy))
    out.entropy = out.entropy / KJKG_TO_BTULBM;

  if (!isNaN(out.specificVolume))
    out.specificVolume = out.specificVolume / M3KG_TO_FT3LBM;

  if (!isNaN(out.density))
    out.density = out.density / KG_M3_TO_LBM_FT3;

  if (!isNaN(out.cp))
    out.cp = out.cp / KJKG_TO_BTULBM;

  if (!isNaN(out.cv))
    out.cv = out.cv / KJKG_TO_BTULBM;

  if (!isNaN(out.viscosity))
    out.viscosity = out.viscosity / PA_S_TO_LBM_FT_S;

  if (!isNaN(out.conductivity))
    out.conductivity = out.conductivity / W_MK_TO_BTUPH_FT_R;

  return out;
}

/* ============================================================
   Convert Internal (IF97) → UI
   ============================================================ */
// Preserve IF97 aliases
if (out.temperature !== undefined) out.T = out.temperature;
if (out.pressure !== undefined) out.P = out.pressure;
if (out.enthalpy !== undefined) out.h = out.enthalpy;
if (out.entropy !== undefined) out.s = out.entropy;


export function fromSI(outputs, system) {

  // SI mode: return as-is
  if (system === "SI") {
    return { ...outputs };
  }

  const out = { ...outputs };

  if (!isNaN(out.temperature))
    out.temperature = out.temperature * K_TO_R - 459.67;

  // MPa → psia
  if (!isNaN(out.pressure))
    out.pressure = out.pressure * MPa_TO_PSIA;

  if (!isNaN(out.enthalpy))
    out.enthalpy = out.enthalpy * KJKG_TO_BTULBM;

  if (!isNaN(out.entropy))
    out.entropy = out.entropy * KJKG_TO_BTULBM;

  if (!isNaN(out.specificVolume))
    out.specificVolume = out.specificVolume * M3KG_TO_FT3LBM;

  if (!isNaN(out.density))
    out.density = out.density * KG_M3_TO_LBM_FT3;

  if (!isNaN(out.cp))
    out.cp = out.cp * KJKG_TO_BTULBM;

  if (!isNaN(out.cv))
    out.cv = out.cv * KJKG_TO_BTULBM;

  if (!isNaN(out.viscosity))
    out.viscosity = out.viscosity * PA_S_TO_LBM_FT_S;

  if (!isNaN(out.conductivity))
    out.conductivity = out.conductivity * W_MK_TO_BTUPH_FT_R;

  return out;
}
