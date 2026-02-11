// pump.js

import { pumpPower } from "./energyBalance.js";
import { totalFrictionLoss } from "./frictionLoss.js";
import { K_pipe } from "./frictionPipe.js";
import { K_entrance, K_exit } from "./entranceExitLoss.js";
import { PIPE_ROUGHNESS } from "./data/pipeRoughness.js";
import { PIPE_ID } from "./data/pipeInnerDiameter.js";
import { getFlowInSI } from "./modeFlowHandler.js";

import {
  getElevationReference,
  getSinkVelocity
} from "./elevationHandler.js";

import {
  getPipeDiameter,
  getPipeMaterial
} from "./pipeMaterialHandler.js";


// fittings UI (side effects only)
import "./fittingsHandler.js";

import { g } from "./utils/constants.js";


document
  .getElementById("calculateBtn")
  .addEventListener("click", () => {

  /* ===============================
     1. READ INPUTS
  =============================== */

  const rho = Number(document.getElementById("rho").value);
  const mu  = Number(document.getElementById("mu").value);

  const A = Math.PI * D * D / 4;
  const m_flow = getFlowInSI(rho, A);

  const L = Number(document.getElementById("pipeLength").value);
  const P1 = Number(document.getElementById("P1").value);
  const P2 = Number(document.getElementById("P2").value);

  const h_input =
    Number(document.getElementById("deltaZ").value);
  
  const elevationRelation =
    document.getElementById("elevationRelation").value;
  
  // Apply sign convention
  const h =
    elevationRelation === "above"
      ? h_input
      : -h_input;


  const point1AtTank =
    document.getElementById("point1Tank").checked;

  const point2AtPipeOutlet =
    document.getElementById("point2PipeOutlet").checked;

  // Pipe geometry
  const nps = document.getElementById("pipeNPS").value;
  const schedule = document.getElementById("pipeSchedule").value;
  const D = getPipeDiameter(PIPE_ID);


  /* ===============================
     2. VELOCITIES
  =============================== */
  // v1: usually zero unless user specifies
  const v1 = point1AtTank
    ? 0
    : Number(document.getElementById("v1").value || 0);

  // v2: only if point 2 is at pipe outlet
 const elevationRef = getElevationReference();

let v2 = 0;
let KexitAdjustment = 0;

if (elevationRef === "pipe") {
  // measured to pipe discharge
  v2 = m_flow / (rho * A);
  KexitAdjustment = 0;
} else {
  // measured to sink surface
  v2 = getSinkVelocity();
  KexitAdjustment = 1;
}


  // velocity in pipe for friction
  const v_pipe = m_flow / (rho * A);

  /* ===============================
     3. LOSS COEFFICIENTS
  =============================== */
  //Pipe roughness
  const material = getPipeMaterial();
  const e = PIPE_ROUGHNESS[material];

  const Kpipe = K_pipe({
  rho,
  mu,
  D,
  v: v_pipe,
  L,
  e
  });
  
  const Kentrance = K_entrance({
    D1: null,
    D2: null,
    fromTank: point1AtTank
  });

const Kexit = KexitAdjustment;


  // Total friction coefficient
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

  document.getElementById("results").classList.remove("hidden");

// Primary result
document.getElementById("pumpPowerValue").textContent =
  result.Ws.toFixed(3);

// Energy table
document.getElementById("energyTable").innerHTML = `
<tr>
  <td>ΔKE</td>
  <td>${result.deltaKE.toFixed(3)}</td>
  <td>J/kg</td>
</tr>
<tr>
  <td>ΔPE</td>
  <td>${result.deltaPE.toFixed(3)}</td>
  <td>J/kg</td>
</tr>
<tr>
  <td>ΔPressure</td>
  <td>${result.deltaP.toFixed(3)}</td>
  <td>J/kg</td>
</tr>
<tr>
  <td>Friction Loss</td>
  <td>${F_total.toFixed(3)}</td>
  <td>J/kg</td>
</tr>
`;

// Hydraulic table
document.getElementById("hydraulicTable").innerHTML = `
<tr>
  <td>Pipe Velocity</td>
  <td>${v_pipe.toFixed(3)}</td>
  <td>m/s</td>
</tr>
<tr>
  <td>Total Loss Coefficient (K)</td>
  <td>${Ktotal.toFixed(3)}</td>
  <td>-</td>
</tr>
`;

});
