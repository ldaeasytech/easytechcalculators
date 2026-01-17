import { Tsat } from "./regions/saturation.js";
import * as liquid from "./regions/liquid.js";
import * as vapor from "./regions/vapor.js";
import { computeQuality } from "./quality.js";

export function solveFromTwoProperties(targets, phase = null) {
  const tol = 1e-6;
  const maxIter = 100;

  // Initial guess
  let T = 500;
  let P = 1e6;
  let x = null;

  for (let i = 0; i < maxIter; i++) {
    const Ts = Tsat(P);
    let props;

    if (phase === "saturated") {
      x = computeQuality({ T, P, ...targets });
      props = saturatedProps(T, P, x);
    } else if (phase === "liquid" || T < Ts) {
      props = liquid.compute(T, P);
    } else {
      props = vapor.compute(T, P);
    }

    const residuals = {};
    let err = 0;

    for (const key in targets) {
      residuals[key] = props[key] - targets[key];
      err += Math.abs(residuals[key]);
    }

    if (err < tol) break;

    // Simple Newton-like adjustment
    T -= 0.001 * residuals.enthalpy || 0;
    P -= 0.001 * residuals.specificVolume || 0;
  }

  return { T, P, quality: x };
}

function saturatedProps(T, P, x) {
  const L = liquid.compute(T, P);
  const V = vapor.compute(T, P);
  const mix = {};
  for (const key in L) mix[key] = (1 - x) * L[key] + x * V[key];
  return mix;
}

