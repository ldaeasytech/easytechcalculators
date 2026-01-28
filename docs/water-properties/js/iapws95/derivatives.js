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
    a0: alpha0(delta, tau),
    ar: alphar(delta, tau),
    ar_d: alphar_delta(delta, tau),
    ar_dd: alphar_deltadelta(delta, tau),
    a0_t: alpha0_tau(tau),
    a0_tt: alpha0_tautau(tau),
    ar_t: alphar_tau(delta, tau),
    ar_tt: alphar_tautau(delta, tau)
  };
}
