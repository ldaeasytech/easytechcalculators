// pump.js

import { pumpPower } from "./energyBalance.js";
import { totalFrictionLoss } from "./frictionLoss.js";
import { K_pipe } from "./frictionPipe.js";
import { K_entrance, K_exit } from "./entranceExitLoss.js";

// fittings logic (already implemented earlier)
import "./fittingsHandler.js"; // assumes this updates global Kf_total

import { g } from "./utils/constants.js";

document
  .getElementById("calculateBtn")
  .addEventListener("click", () => {

  /* ===============================
     1. READ INPUTS
  =============================== */

  const rho = Number(document.getElementById("rho").value);
  const mu  = Number(document.getElementById("mu").value);
  const m_flow = Number(document.getElementById("mdot").value);

  const D = Number(document.getElementById("pipeDiameter").value);
  const L = Number(document.getElementById("pipeLength").value);
  const e = Number(document.getElementById("roughness").value);

  const h = Number(document.getElementById("deltaZ").value);
  const P1 = Number(document.getElementById("P1").value);
  const P2 = Number(document.getElementById("P2").value);

  const point1AtTank =
    document.getElementById("point1Tank").checked;

  const point2AtPipeOutlet =
    document.getElementById("point2PipeOutlet").checked;

  /* ===============================
     2. VELOCITIES
  =============================== */

  const A = Math.PI * D * D / 4;

  // v1: usually zero unless user specifies
  const v1 = point1AtTank
    ? 0
    : Number(document.getElementById("v1").value || 0);

  // v2: only if point 2 is at pipe outlet
  let v2 = 0;
  if (point2AtPipeOutlet) {
    v2 = m_flow / (rho * A);
  }

  // velocity in pipe for friction
  const v_pipe = m_flow / (rho * A);

  /* ===============================
     3. LOSS COEFFICIENTS
  =============================== */

  const Kpipe = K_pipe({
    rho,
    mu,
    D,
    v: v_pipe,
    L,
    e = PIPE_ROUGHNESS[selectedMaterial];
  });
  
  const Kentrance = K_entrance({
    D1: null,
    D2: null,
    fromTank: point1AtTank
  });

  const Kexit = K_exit({
    D1: null,
    D2: null,
    toTank: !point2AtPipeOutlet
  });

  // Kf_total is accumulated from fittings UI
  const Ktotal =
    Kpipe + Kentrance + Kexit + window.Kf_total;

  /* ===============================
     4. TOTAL FRICTION LOSS (J/kg)
  =============================== */

  const F_total = totalFrictionLoss(v_pipe, Ktotal);

  /* ===============================
     5. MECHANICAL ENERGY BALANCE
  =============================== */

  const result = pumpPower({
    m_flow,
    v1,
    v2,
    h,
    P1,
    P2,
    rho,
    F_total
  });

  /* ===============================
     6. DISPLAY RESULTS
  =============================== */

  document.getElementById("results").hidden = false;

  document.getElementById("pumpPower").textContent =
    `Theoretical pump power: ${result.Ws.toFixed(3)} kW`;

  document.getElementById("lossBreakdown").innerHTML = `
    ΔKE = ${result.deltaKE.toFixed(3)} J/kg<br>
    ΔPE = ${result.deltaPE.toFixed(3)} J/kg<br>
    ΔP  = ${result.deltaP.toFixed(3)} J/kg<br>
    Friction = ${F_total.toFixed(3)} J/kg
  `;
});
