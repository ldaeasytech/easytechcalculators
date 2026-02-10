import { calculatePumpPower } from './energyBalance.js';
import { pipeHeadLoss } from './frictionLoss.js';

document.getElementById("calculateBtn")
  .addEventListener("click", () => {

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value);
    const mdot = Number(document.getElementById("mdot").value);
    const deltaZ = Number(document.getElementById("deltaZ").value);

    const D = 0.05; // placeholder (pipe selector next)
    const L = Number(document.getElementById("pipeLength").value);

    const area = Math.PI * D * D / 4;
    const v = mdot / (rho * area);

    const headLoss = pipeHeadLoss({
      L,
      D,
      rho,
      mu,
      v,
      roughness: 0.000045
    });

    const result = calculatePumpPower({
      rho,
      mdot,
      deltaZ,
      headLoss
    });

    document.getElementById("results").hidden = false;
    document.getElementById("pumpPower").textContent =
      `Required pump power (ideal): ${(result.power / 1000).toFixed(2)} kW`;
});

