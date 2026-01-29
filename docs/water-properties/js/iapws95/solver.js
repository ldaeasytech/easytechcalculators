// iapws95/solver.js
// Density solver for IAPWS-95 (DEBUG VERSION, API-CORRECT)

import { R, Tc, rhoc, MAX_ITER, TOL } from "./constants95.js";
import { helmholtz } from "./derivatives.js";

/* ============================================================
   Pressure from density using Helmholtz EOS
   ============================================================ */
function pressureFromRho(T, rho) {
  const h = helmholtz(T, rho, Tc, rhoc);
  const delta = h.delta;

  // Pa → MPa
  return rho * R * T * (1 + delta * h.ar_d) * 1e-6;
}

/* ============================================================
   dP/drho at constant T
   ============================================================ */
function dPdrho(T, rho) {
  const h = helmholtz(T, rho, Tc, rhoc);
  const delta = h.delta;

  const term =
    1 +
    2 * delta * h.ar_d +
    delta * delta * h.ar_dd;

  return R * T * term * 1e-6; // MPa·m³/kg
}

/* ============================================================
   Main density solver (Newton + bisection, instrumented)
   ============================================================ */
export function solveDensity(T, P) {
  console.groupCollapsed(
    `%c[IAPWS-95 Density Solver] T=${T} K, P=${P} MPa`,
    "color:#00ffaa;font-weight:bold"
  );

  // Ideal-gas initial guess
  let rho = Math.max((P * 1e6) / (R * T), 1.0);
  console.log("Initial rho guess:", rho);

  // Global bracket (safe for water)
  let a = 1.0;
  let b = 1500.0;

  let fa = pressureFromRho(T, a) - P;
  let fb = pressureFromRho(T, b) - P;

  console.table([
    { rho: a, Pcalc: pressureFromRho(T, a), f: fa },
    { rho: b, Pcalc: pressureFromRho(T, b), f: fb }
  ]);

  if (fa * fb > 0) {
    console.error("❌ No sign change in pressure bracket");
  }

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
      rhoNew = rho - f / dP;
    }

    // Safeguard → bisection
    if (!isFinite(rhoNew) || rhoNew <= a || rhoNew >= b) {
      rhoNew = 0.5 * (a + b);
      console.warn("Bisection step used");
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
