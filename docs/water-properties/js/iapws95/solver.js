// iapws95/solver.js
// Phase-aware density solver for IAPWS-95 (single phase)

import { R, rhoc, MAX_ITER, TOL } from "./constants95.js";
import { pressureFromRho, dPdrho } from "./pressure.js";
import { Psat } from "../if97/region4.js";

export function solveDensity(T, P) {

  console.group(`[IAPWS-95 Density Solver] T=${T} K, P=${P} MPa`);

  const P_Pa = P * 1e6;
  const Ps = Psat(T);

  let rho, a, b;

  // --------------------------------------------------
  // Phase detection
  // --------------------------------------------------
  const isLiquid = P > Ps;

  if (isLiquid) {
    console.log("Phase: compressed liquid");

    // Liquid densities live here
    a = 200.0;
    b = 1500.0;
    rho = 1000.0;

  } else {
    console.log("Phase: superheated vapor");

    const rho_ig = P_Pa / (R * T);
    a = Math.max(1e-6, 0.1 * rho_ig);
    b = 10.0 * rho_ig;
    rho = rho_ig;
  }

  // --------------------------------------------------
  // Ensure pressure bracket
  // --------------------------------------------------
  for (let i = 0; i < 50; i++) {
    const fa = pressureFromRho(T, a) - P;
    const fb = pressureFromRho(T, b) - P;

    if (fa * fb < 0) break;

    a *= isLiquid ? 0.8 : 0.5;
    b *= isLiquid ? 1.2 : 2.0;
  }

  // --------------------------------------------------
  // Newton + bisection
  // --------------------------------------------------
  for (let iter = 0; iter < MAX_ITER; iter++) {

    const Pcalc = pressureFromRho(T, rho);
    const f = Pcalc - P;

    console.log(
      `iter ${iter}: rho=${rho.toFixed(6)} ` +
      `Pcalc=${Pcalc.toFixed(6)} MPa`
    );

    if (Math.abs(f) < TOL) {
      console.log("✓ Converged");
      console.groupEnd();
      return rho;
    }

    const dPd = dPdrho(T, rho);
    let rho_new = rho - f / dPd;

    if (!isFinite(rho_new) || rho_new <= a || rho_new >= b) {
      rho_new = 0.5 * (a + b);
    }

    if ((pressureFromRho(T, a) - P) * (pressureFromRho(T, rho_new) - P) < 0) {
      b = rho_new;
    } else {
      a = rho_new;
    }

    rho = rho_new;
  }

  console.groupEnd();
  throw new Error("IAPWS-95 density solver did not converge");
}
