import { Tsat } from "./regions/saturation.js";
import * as ice from "./regions/ice.js";
import * as liquid from "./regions/liquid.js";
import * as vapor from "./regions/vapor.js";
import { computeQuality } from "./quality.js";

export function computeProperties(T, P, phase = null, quality = null) {
  let regionPhase = phase;

  const Ts = Tsat(P);

  if (!regionPhase) {
    if (T < Ts - 0.1) regionPhase = "liquid";
    else if (T > Ts + 0.1) regionPhase = "vapor";
    else regionPhase = "saturated";
  }

  let props;

  if (regionPhase === "ice") {
    props = ice.compute(T, P);
  } else if (regionPhase === "liquid") {
    props = liquid.compute(T, P);
  } else if (regionPhase === "vapor") {
    props = vapor.compute(T, P);
  } else if (regionPhase === "saturated") {
    if (quality == null) {
      quality = computeQuality({ T, P });
    }
    props = saturatedMixture(T, P, quality);
  } else {
    throw new Error("Unknown phase");
  }

  return {
    ...props,
    temperature: T,
    pressure: P,
    phase: regionPhase,
    quality
  };
}

function saturatedMixture(T, P, x) {
  const L = liquid.compute(T, P);
  const V = vapor.compute(T, P);

  const mix = {};
  for (const key of Object.keys(L)) {
    if (typeof L[key] === "number" && typeof V[key] === "number") {
      mix[key] = (1 - x) * L[key] + x * V[key];
    }
  }
  return mix;
}

