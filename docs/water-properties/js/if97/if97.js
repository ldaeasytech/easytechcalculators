import { props as r1 } from "./region1.js";
import { props as r2 } from "./region2.js";
import { props as r3 } from "./region3.js";
import { props as r5 } from "./region5.js";
import { Tsat } from "./region4.js";

export function computeIF97(T, P) {
  const Ts = Tsat(P);
  if (T < Ts && P > 1e5) return r1(T, P);
  if (T > Ts && T < 1073.15) return r2(T, P);
  if (T >= 1073.15) return r5(T, P);
  return r3(T, P);
}

