const K_TO_R = 1.8;
const PA_TO_PSIA = 0.0001450377;
const KJKG_TO_BTULBM = 0.429922614;
const M3KG_TO_FT3LBM = 16.018463;
const KG_M3_TO_LBM_FT3 = 0.06242796;
const PA_S_TO_LBM_FT_S = 0.020885434;
const W_MK_TO_BTUPH_FT_R = 0.577789;

export function toSI(inputs, system) {
  if (system === "SI") return inputs;

  const out = { ...inputs };
  if (!isNaN(out.temperature)) out.temperature = (out.temperature + 459.67) / K_TO_R;
  if (!isNaN(out.pressure)) out.pressure = out.pressure / PA_TO_PSIA;
  if (!isNaN(out.enthalpy)) out.enthalpy = out.enthalpy / KJKG_TO_BTULBM;
  if (!isNaN(out.entropy)) out.entropy = out.entropy / KJKG_TO_BTULBM;
  if (!isNaN(out.specificVolume)) out.specificVolume = out.specificVolume / M3KG_TO_FT3LBM;
  if (!isNaN(out.density)) out.density = out.density / KG_M3_TO_LBM_FT3;
  if (!isNaN(out.cp)) out.cp = out.cp / KJKG_TO_BTULBM;
  if (!isNaN(out.cv)) out.cv = out.cv / KJKG_TO_BTULBM;
  if (!isNaN(out.viscosity)) out.viscosity = out.viscosity / PA_S_TO_LBM_FT_S;
  if (!isNaN(out.conductivity)) out.conductivity = out.conductivity / W_MK_TO_BTUPH_FT_R;

  return out;
}

export function fromSI(outputs, system) {
  if (system === "SI") return outputs;

  const out = { ...outputs };
  if (!isNaN(out.temperature)) out.temperature = out.temperature * K_TO_R - 459.67;
  if (!isNaN(out.pressure)) out.pressure = out.pressure * PA_TO_PSIA;
  if (!isNaN(out.enthalpy)) out.enthalpy = out.enthalpy * KJKG_TO_BTULBM;
  if (!isNaN(out.entropy)) out.entropy = out.entropy * KJKG_TO_BTULBM;
  if (!isNaN(out.specificVolume)) out.specificVolume = out.specificVolume * M3KG_TO_FT3LBM;
  if (!isNaN(out.density)) out.density = out.density * KG_M3_TO_LBM_FT3;
  if (!isNaN(out.cp)) out.cp = out.cp * KJKG_TO_BTULBM;
  if (!isNaN(out.cv)) out.cv = out.cv * KJKG_TO_BTULBM;
  if (!isNaN(out.viscosity)) out.viscosity = out.viscosity * PA_S_TO_LBM_FT_S;
  if (!isNaN(out.conductivity)) out.conductivity = out.conductivity * W_MK_TO_BTUPH_FT_R;

  return out;
}

