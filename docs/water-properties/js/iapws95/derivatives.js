import {
  alpha0,
  alpha0_tau,
  alpha0_tautau,
  alphar,
  alphar_delta,
  alphar_deltadelta,
  alphar_tau,
  alphar_tautau
} from "./helmholtz.js";

export function helmholtz(T, rho, Tc, rhoc) {
  const delta = rho / rhoc;
  const tau = Tc / T;

  return {
    delta,
    tau,

    // Helmholtz energy
    a0: alpha0(delta, tau),
    ar: alphar(delta, tau),

    // First derivatives wrt tau
    a0_t: alpha0_tau(tau),
    ar_t: alphar_tau(delta, tau),

    // Second derivatives wrt tau (IMPORTANT: τ² scaling)
    a0_tt: tau * tau * alpha0_tautau(tau),
    ar_tt: tau * tau * alphar_tautau(delta, tau),

    // Delta derivatives
    ar_d: alphar_delta(delta, tau),
    ar_dd: alphar_deltadelta(delta, tau)
  };
}
