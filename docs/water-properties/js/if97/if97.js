import { region1 } from "./region1.js";
import { region2 } from "./region2.js";
import { region3 } from "./region3.js";
import { region5 } from "./region5.js";
import { Psat } from "./region4.js";

const T23 = 623.15;      // K
const P23 = 16.529;      // MPa
const T5 = 1073.15;      // K
const EPS = 1e-6;

export function computeIF97(T, P) {
  // T in K, P in MPa

  // Region 5: high-temperature steam
  if (T >= T5) {
    return region5(T, P);
  }

  // Below Region 3 boundary
  if (T < T23) {
    const Ps = Psat(T);

    if (Math.abs(P - Ps) < EPS) {
      return {
        region: 4,
        phase: "two-phase",
        T,
        P,
        message: "Two-phase state: specify quality (x)"
      };
    }

    if (P > Ps) {
      return region1(T, P);
    } else {
      return region2(T, P);
    }
  }

  // Above Region 3 boundary
  if (P > P23) {
    return region3(T, P);
  }

  return region2(T, P);
}
