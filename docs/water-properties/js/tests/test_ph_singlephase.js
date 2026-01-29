// docs/water-properties/js/tests/test_ph_singlephase.js

import { solve } from "../solver.js";
import { Tsat } from "../if97/region4.js";

function relErr(a, b) {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
}

const TOL_T = 1e-5;
const TOL_H = 5e-4;

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

  const ref = solve({
    mode: "TP",
    temperature: T,
    pressure: P
  });

  const r = solve({
    mode: "Ph",
    pressure: P,
    enthalpy: ref.enthalpy
  });

  const Terr = Math.abs(r.temperature - T);
  const Herr = relErr(r.enthalpy, ref.enthalpy);

  if (Terr > TOL_T || Herr > TOL_H) {
    console.error("❌ PH inversion failed", {
      P,
      T_expected: T,
      T_got: r.temperature,
      Terr,
      Herr
    });
    return;
  }

  console.log("✅ PASS", {
    P,
    h: ref.enthalpy,
    T: r.temperature,
    phase: r.phase
  });
});
