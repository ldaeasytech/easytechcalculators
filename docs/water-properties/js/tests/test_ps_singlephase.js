// docs/water-properties/js/tests/test_ps_singlephase.js

import { solvePS, solveTP } from "../solver.js";
import { Tsat } from "../if97/region4.js";

function relErr(a, b) {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
}

const TOL = {
  T: 1e-6,
  s: 5e-4
};

const seedTP = [
  { T: 310, P: 6e6 },
  { T: 360, P: 12e6 },
  { T: 600, P: 2e6 },
  { T: 800, P: 4e6 }
];

console.log("=== PS SINGLE-PHASE TEST ===");

seedTP.forEach(({ T, P }) => {
  const Ts = Tsat(P);
  if (Math.abs(T - Ts) < 1e-3) return;

  const ref = solveTP(T, P);
  const s = ref.s;

  const result = solvePS(P, s);

  const Terr = Math.abs(result.T - T);
  const serr = relErr(result.s, s);

  if (Terr > TOL.T || serr > TOL.s) {
    console.error("❌ PS inversion failed", {
      P,
      s,
      T_expected: T,
      T_got: result.T
    });
    return;
  }

  console.log("✅ PASS", {
    P,
    s,
    T: result.T,
    state: result.state
  });
});
