// docs/water-properties/js/tests/test_tp_singlephase.js

import { solveTP } from "../solver.js";
import { Tsat } from "../if97/region4.js";

// relative tolerance helper
function relErr(a, b) {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
}

// tolerance table
const TOL = {
  rho: 5e-4,
  h: 5e-4,
  s: 5e-4,
  cp: 1e-3,
  cv: 2e-3
};

// TP single-phase test points
const tests = [
  // subcooled liquid
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

  if (Math.abs(T - Ts) < 1e-3) {
    console.warn("Skipped saturated test:", T, P);
    return;
  }

  const result = solveTP(T, P);

  const expectedPhase =
    T < Ts ? "subcooled liquid" : "superheated vapor";

  if (result.state !== expectedPhase) {
    console.error("❌ Phase mismatch", { T, P, expectedPhase, got: result.state });
    return;
  }

  const if97 = result.if97;     // initial guess result
  const iapws = result.iapws;   // final refined result

  const checks = [
    ["rho", TOL.rho],
    ["h", TOL.h],
    ["s", TOL.s],
    ["cp", TOL.cp],
    ["cv", TOL.cv]
  ];

  for (const [key, tol] of checks) {
    const err = relErr(iapws[key], if97[key]);
    if (err > tol) {
      console.error(`❌ ${key} mismatch`, { T, P, err });
      return;
    }
  }

  console.log("✅ PASS", {
    T,
    P,
    state: result.state
  });
});
