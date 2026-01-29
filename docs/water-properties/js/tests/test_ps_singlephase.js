// docs/water-properties/js/tests/test_ps_singlephase.js

import { solve } from "../solver.js";
import { Tsat } from "../if97/region4.js";

function relErr(a, b) {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
}

const TOL_P = 1e-6;
const TOL_S = 5e-4;

const seedTP = [
  { T: 310, P: 6 },
  { T: 360, P: 12 },
  { T: 600, P: 2 },
  { T: 800, P: 4 }
];

console.log("=== PS SINGLE-PHASE TEST ===");

seedTP.forEach(({ T, P }) => {
  const Ts = Tsat(P);
  if (Math.abs(T - Ts) < 1e-3) return;

  const ref = solve({
    mode: "TP",
    temperature: T,
    pressure: P
  });

  const r = solve({
    mode: "Ts",
    temperature: T,
    entropy: ref.entropy
  });

  const Perr = relErr(r.pressure, P);
  const Serr = relErr(r.entropy, ref.entropy);

  if (Perr > TOL_P || Serr > TOL_S) {
    console.error("❌ PS inversion failed", {
      T,
      P_expected: P,
      P_got: r.pressure,
      Perr,
      Serr
    });
    return;
  }

  console.log("✅ PASS", {
    T,
    s: ref.entropy,
    P: r.pressure,
    phase: r.phase
  });
});
