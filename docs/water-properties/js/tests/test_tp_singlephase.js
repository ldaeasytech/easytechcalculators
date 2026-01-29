// docs/water-properties/js/tests/test_tp_singlephase.js

import { solve } from "../solver.js";
import { Tsat } from "../if97/region4.js";

function assert(cond, msg, ctx = {}) {
  if (!cond) {
    console.error("❌", msg, ctx);
    return false;
  }
  return true;
}

const tests = [
  // compressed / subcooled liquid
  { T: 300, P: 5e6 },
  { T: 350, P: 10e6 },
  { T: 400, P: 20e6 },

  // superheated vapor
  { T: 500, P: 1e5 },
  { T: 700, P: 1e6 },
  { T: 900, P: 5e6 }
];

console.log("=== TP SINGLE-PHASE TEST ===");

tests.forEach(({ T, P }) => {
  const Ts = Tsat(P);
  if (Math.abs(T - Ts) < 1e-3) return;

  const r = solve({
    mode: "TP",
    temperature: T,
    pressure: P
  });

  const expected =
    P > Tsat(T) ? "compressed_liquid" : "superheated_steam";

  if (!assert(r.phase === expected, "Phase mismatch", { T, P, got: r.phase })) return;

  assert(Number.isFinite(r.density) && r.density > 0, "Invalid density", r);
  assert(Number.isFinite(r.enthalpy), "Invalid enthalpy", r);
  assert(Number.isFinite(r.entropy), "Invalid entropy", r);
  assert(Number.isFinite(r.cp), "Invalid Cp", r);
  assert(Number.isFinite(r.cv), "Invalid Cv", r);
  assert(Number.isFinite(r.viscosity), "Invalid viscosity", r);
  assert(Number.isFinite(r.thermalConductivity), "Invalid conductivity", r);

  console.log("✅ PASS", { T, P, phase: r.phase });
});
