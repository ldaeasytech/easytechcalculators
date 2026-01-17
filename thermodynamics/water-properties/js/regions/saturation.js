export function Tsat(P) {
  const Pc = 22.064e6;
  const Tc = 647.096;
  return Tc * Math.pow(P / Pc, 0.25);
}

