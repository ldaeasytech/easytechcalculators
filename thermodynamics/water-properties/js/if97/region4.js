export function Tsat(P) {
  const Pc = 22.064e6;
  const Tc = 647.096;
  const theta = Math.pow(P / Pc, 0.25);
  return Tc * theta;
}

