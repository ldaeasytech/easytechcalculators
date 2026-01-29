// docs/water-properties/js/tests/test_tp_singlephase.js

import { solve } from "../solver.js";
import { Psat } from "../if97/region4.js";

/* ------------------------------------------------------------
   Simple assertion helper
------------------------------------------------------------ */
function assert(cond, msg, ctx = {}) {
  if (!cond) {
    console.error("❌", msg, ctx);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------
   TP single-phase test cases
   NOTE: Pressure is in MPa (solver contract)
------------------------------------------------------------ */
const tests = [
  // Compressed / subcooled liquid
  { T: 300, P: 5.0 },
  { T: 350, P: 10.0 },
  { T: 400, P: 20.0 },

  // Superheated steam
  { T: 500, P: 0.1 },
  { T: 700, P: 1.0 },
  { T: 900, P: 5.0 }
];

console.log("=== TP SINGLE-PHASE TEST ===");

/* ------------------------------------------------------------
   Run tests
------------------------------------------------------------ */
tests.forEach(({ T, P }) => {
  const Ps = Psat(T); // MPa

  // Expected phase (EXACTLY matches solver logic)
  const expected =
    P > Ps ? "compressed_liquid" : "superheated_steam";

  const r = solve({
    mode: "TP",
    temperature: T,
    pressure: P
  });

  // ---- Phase check ----
  if (!assert(
    r.phase === expected,
    "Phase mismatch",
    { T, P, expected, got: r.phase }
  )) return;

  // ---- Sanity checks on properties ----
  assert(Number.isFinite(r.density) && r.density > 0, "Invalid density", r);
  assert(Number.isFinite(r.enthalpy), "Invalid enthalpy", r);
  assert(Number.isFinite(r.entropy), "Invalid entropy", r);
  assert(Number.isFinite(r.cp), "Invalid Cp", r);
  assert(Number.isFinite(r.cv), "Invalid Cv", r);
  assert(Number.isFinite(r.viscosity), "Invalid viscosity", r);
  assert(Number.isFinite(r.thermalConductivity), "Invalid conductivity", r);

  console.log("✅ PASS", {
    T,
    P,
    phase: r.phase
  });
});
