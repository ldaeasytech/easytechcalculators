import { computeIF97 } from "./if97.js";

export function compareToIF97(T, P, props) {
  const ref = computeIF97(T, P);
  const comparison = {};

  for (const key in props) {
    if (typeof props[key] === "number" && typeof ref[key] === "number") {
      const err = props[key] - ref[key];
      const rel = err / ref[key] * 100;
      comparison[key] = {
        model: props[key],
        IF97: ref[key],
        absError: err,
        relErrorPercent: rel
      };
    }
  }

  return comparison;
}

