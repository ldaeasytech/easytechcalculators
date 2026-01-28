import { pressure, dPdrho } from "./pressure.js";
import { MAX_ITER, TOL } from "./constants95.js";

export function solveDensity(T, P, rho0) {
  let rho = rho0;

  for (let i = 0; i < MAX_ITER; i++) {
    const f = pressure(T, rho) - P;
    if (Math.abs(f / P) < TOL) return rho;

    const df = dPdrho(T, rho);
    if (!isFinite(df) || df <= 0) break;

    let step = f / df;

    // damping (critical!)
    step = Math.sign(step) * Math.min(Math.abs(step), 0.5 * rho);

    rho -= step;
    if (rho <= 0) rho *= 0.5;
  }

  throw new Error("IAPWS-95 density solver failed");
}

