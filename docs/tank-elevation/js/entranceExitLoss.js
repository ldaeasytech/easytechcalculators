// js/entranceExitLoss.js

export function area(D) {
  return Math.PI * D * D / 4;
}

/* ========= ENTRANCE ========= */

export function K_entrance_pipe(D1, D2) {
  const A1 = area(D1);
  const A2 = area(D2);
  return 0.5 * (1 - A2 / A1);
}

export function K_entrance_tank() {
  return 0.5;
}

export function K_entrance({ D1, D2, fromTank }) {
  const Kp = (D1 && D2) ? K_entrance_pipe(D1, D2) : 0;
  const Kt = fromTank ? K_entrance_tank() : 0;
  return Kp + Kt;
}

/* ========= EXIT ========= */

export function K_exit_pipe(D1, D2) {
  const A1 = area(D1);
  const A2 = area(D2);
  return Math.pow(1 - A1 / A2, 2);
}

export function K_exit_tank(isDischargingToTank) {
  return isDischargingToTank ? 1 : 0;
}

export function K_exit({ D1, D2, toTank }) {
  const Kp = (D1 && D2) ? K_exit_pipe(D1, D2) : 0;
  const Kt = K_exit_tank(toTank);
  return Kp + Kt;
}
