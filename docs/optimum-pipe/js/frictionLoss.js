export function totalFrictionLoss(v, Ktotal) {
  // J/kg
  return Ktotal * (v * v) / 2;
}

