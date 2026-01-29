// docs/water-properties/js/tests/test_ph_singlephase.js

import { solvePH, solveTP } from "../solver.js";
import { Tsat } from "../if97/region4.js";

function relErr(a, b) {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
}

const TOL = {
  T: 1e-6,
  h: 5e-4
};

// generate PH tests from known TP states
const seedTP = [
  { T: 320, P: 8e6 },
  { T: 380, P: 15e6 },
  { T: 650, P: 1e6 },
  { T: 850, P: 3e6 }
];

console.log("=== PH SINGLE-PHASE TEST ===");

seedTP.forEach(({ T, P }) => {
  const Ts = Tsat(P);
  if (Math.abs(T - Ts) < 1e-3) return;

  const ref = solveTP(T, P);
  const h = ref.h;

  const result = solvePH(P, h);

  const Terr = Math.abs(result.T - T);
  const herr = relErr(result.h, h);

  if (Terr > TOL.T || herr > TOL.h) {
    console.error("❌ PH inversion failed", {
      P,
      h,
      T_expected: T,
      T_got: result.T
    });
    return;
  }

  console.log("✅ PASS", {
    P,
    h,
    T: result.T,
    state: result.state
  });
});
