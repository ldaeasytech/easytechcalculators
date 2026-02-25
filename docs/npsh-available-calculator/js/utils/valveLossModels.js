export function gateValveK(xo) {
  return 2315400000 * Math.exp(-0.8488 * xo)
       + 113.389 * Math.exp(-0.0645 * xo);
}

export function diaphragmValveK(xo) {
  return 196.4532 * Math.exp(-0.0951 * xo)
       + 2.9867 * Math.exp(-0.0027 * xo);
}

export function globeValveK(xo) {
  return 352.97 * Math.exp(-0.046 * xo)
       + 0.0623 * Math.exp(0.0447 * xo);
}

export function plugCockK(cd) {
  return 0.1224 * Math.exp(0.1238 * cd)
       - 0.4784 * Math.exp(-0.1827 * cd);
}

export function butterflyValveK(cd) {
  if (cd >= 5 && cd <= 20) {
    return 0.0031 * cd * cd + 0.01 * cd + 0.1133;
  }
  if (cd > 20 && cd <= 60) {
    return 0.093 * Math.exp(0.1191 * cd);
  }
  throw new Error("Butterfly valve valid for 5–60° closed");
}
