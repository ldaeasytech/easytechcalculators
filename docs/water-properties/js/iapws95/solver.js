// iapws95/solver.js
// Density solver for IAPWS-95 using Helmholtz EOS
// DEBUG / INSTRUMENTED VERSION

import { R } from "./constants95.js";
import {
  helmholtzResidual,
  helmholtzResidual_dDelta,
  helmholtzResidual_dDelta2
} from "./helmholtz.js";

/* ============================================================
   Pressure from density
   ------------------------------------------------------------
   Inputs:
     T   : K
     rho : kg/m^3
   Output:
     P   : MPa
   ============================================================ */
function pressureFromRho(T, rho) {
  const delta = rho / 322.0;      // rhoc = 322 kg/m^3
  const tau = 647.096 / T;        // Tc = 647.096 K

  const phir_d = helmholtzResidual_dDelta(delta, tau);

  // Pa → MPa
  return rho * R * T * (1 + delta * phir_d) * 1e-6;
}

/* ============================================================
   dP/drho from EOS
   ============================================================ */
function dPdrho(T, rho) {
  const delta = rho / 322.0;
  const tau = 647.096 / T;

  const phir_d = helmholtzResidual_dDelta(delta, tau);
  const phir_dd = helmholtzResidual_dDelta2(delta, tau);

  const term =
    1 +
    2 * delta * phir_d +
    delta * delta * phir_dd;

  return R * T * term * 1e-6; // MPa·m^3/kg
}

/* ============================================================
   Main density solver
   ============================================================ */
export function solveDensity_IAPWS95(T, P) {
  const MAX_ITER = 50;
  const TOL = 1e-6;

  console.groupCollapsed(
    `%c[IAPWS-95 Density Solver] T=${T} K, P=${P} MPa`,
    "color:#00ffaa;font-weight:bold"
  );

  /* ----------------------------------------------------------
     Initial guess (ideal gas)
     ---------------------------------------------------------- */
  let rho = Math.max((P * 1e6) / (R * T), 1.0);
  console.log("Initial rho guess =", rho);

  /* ----------------------------------------------------------
     Fixed global bracket (safe for water)
     ---------------------------------------------------------- */
  let a = 1.0;
  let b = 1500.0;

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  console.log("Initial bracket:");
  console.table([
    { rho: a, Pcalc: pressureFromRho(T, a), f: fa },
    { rho: b, Pcalc: pressureFromRho(T, b), f: fb }
  ]);

  if (fa * fb > 0) {
    console.error("❌ No sign change in bracket — EOS or units are wrong");
  }

  /* ----------------------------------------------------------
     Iteration loop
     ---------------------------------------------------------- */
  for (let iter = 1; iter <= MAX_ITER; iter++) {
    const Pcalc = pressureFromRho(T, rho);
    const f = Pcalc - P;
    const dP = dPdrho(T, rho);

    console.group(`Iteration ${iter}`);
    console.log("rho =", rho);
    console.log("Pcalc =", Pcalc, "MPa");
    console.log("Residual =", f);
    console.log("dP/drho =", dP);

    if (Math.abs(f) < TOL) {
      console.log("✅ CONVERGED");
      console.groupEnd();
      console.groupEnd();
      return rho;
    }

    let rhoNew = rho;

    // Newton step
    if (isFinite(dP) && Math.abs(dP) > 1e-12) {
      const step = f / dP;
      rhoNew = rho - step;
      console.log("Newton step =", step);
    } else {
      console.warn("Derivative invalid → bisection");
      rhoNew = 0.5 * (a + b);
    }

    // Safeguard
    if (!isFinite(rhoNew) || rhoNew <= a || rhoNew >= b) {
      console.warn("Out of bracket → bisection");
      rhoNew = 0.5 * (a + b);
    }

    const fNew = pressureFromRho(T, rhoNew) - P;

    console.log("rho_new =", rhoNew);
    console.log("f_new =", fNew);

    // Update bracket
    if (fa * fNew < 0) {
      b = rhoNew;
      fb = fNew;
    } else {
      a = rhoNew;
      fa = fNew;
    }

    rho = rhoNew;

    console.groupEnd();
  }

  console.error("❌ IAPWS-95 density solver did not converge");
  console.groupEnd();
  throw new Error("IAPWS-95 density solver did not converge");
}
