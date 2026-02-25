// js/energyBalance.js
import { g } from "./utils/constants.js";

/*
 Ws = m_flow * (ΔKE + ΔPE + ΔP + F_total) / 1000
 Units:
  - m_flow : kg/s
  - terms  : J/kg
  - Ws     : kW
*/

export function pumpPower({
  m_flow,
  v1 = 0,
  v2 = 0,
  h,
  P1,
  P2,
  rho,
  F_total
}) {
  // ΔKE = (v2² − v1²) / 2
  const deltaKE = (v2 * v2 - v1 * v1) / 2;

  // ΔPE = g · h
  const deltaPE = g * h;

  // ΔPressure = (P2 − P1) / ρ
  const deltaP = (P2 - P1) / rho;

  // Pump power (kW)
  const Ws =
    m_flow * (deltaKE + deltaPE + deltaP + F_total) / 1000;

  return {
    Ws,
    deltaKE,
    deltaPE,
    deltaP
  };
}

