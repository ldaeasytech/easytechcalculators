// region5.js — IF97 Region 5 (High-Temperature Steam)

import { R, EPS } from "../constants.js";

const J = [0,1,-3,-2,-1,2];
const n = [
  -13.179983674201,
  6.8540841634434,
  -0.024805148933466,
  0.36901534980333,
  -3.1161318213925,
  -0.32961626538917
];

export function region5(T, P) {
  const tau = 1000 / T;

  let g = Math.log(P);
  let gt = 0, gtt = 0;

  for (let i = 0; i < n.length; i++) {
    const t = Math.pow(tau, J[i]);
    g += n[i] * t;
    gt += n[i] * J[i] * t / tau;
    gtt += n[i] * J[i] * (J[i] - 1) * t / (tau * tau);
  }

  const v = R * T / P;
  const density = 1 / Math.max(v, EPS);
  const enthalpy = R * T * tau * gt;
  const entropy = R * (tau * gt - g);
  const cp = -R * tau * tau * gtt;
  const cv = cp - R;

  return {
    region: 5,
    phase: "high_temperature_steam",
    T, P,
    density,
    specificVolume: v,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
