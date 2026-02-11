// pump.js

import { initModeFlowHandlers, getFlowInSI }
  from "./modeFlowHandler.js";

import { pumpPower } from "./energyBalance.js";
import { totalFrictionLoss } from "./frictionLoss.js";
import { K_pipe } from "./frictionPipe.js";
import { K_entrance } from "./entranceExitLoss.js";

import { PIPE_ROUGHNESS } from "./data/pipeRoughness.js";
import { PIPE_ID } from "./data/pipeInnerDiameter.js";

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


document.addEventListener("DOMContentLoaded", () => {

  // 🔹 initialize flow/mode tabs AFTER DOM loads
  initModeFlowHandlers();

  document
    .getElementById("calculateBtn")
    .addEventListener("click", () => {

    /* ===============================
       1. READ INPUTS
    =============================== */

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value);

    // Pipe geometry FIRST
    const D = getPipeDiameter(PIPE_ID);
    const A = Math.PI * D * D / 4;

    const m_flow = getFlowInSI(rho);

    const L = Number(document.getElementById("pipeLength").value);
    const P1 = Number(document.getElementById("P1").value);
    const P2 = Number(document.getElementById("P2").value);

    const h_input =
      Number(document.getElementById("deltaZ").value);

    const elevationRelation =
      document.getElementById("elevationRelation").value;

    const h =
      elevationRelation === "above"
        ? h_input
        : -h_input;

    const point1AtTank =
      document.getElementById("point1Tank").checked;

    const point2AtPipeOutlet =
      document.getElementById("point2PipeOutlet").checked;

    /* ===============================
       2. VELOCITIES
    =============================== */

    const v1 = point1AtTank
      ? 0
      : Number(document.getElementById("v1").value || 0);

    const elevationRef = getElevationReference();

    let v2 = 0;
    let KexitAdjustment = 0;

    if (elevationRef === "pipe") {
      v2 = m_flow / (rho * A);
      KexitAdjustment = 0;
    } else {
      v2 = getSinkVelocity();
      KexitAdjustment = 1;
    }

    const v_pipe = m_flow / (rho * A);

    /* ===============================
       3. LOSS COEFFICIENTS
    =============================== */

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

    const Ktotal =
      Kpipe + Kentrance + Kexit + window.Kf_total;

    /* ===============================
       4. FRICTION LOSS
    =============================== */

    const F_total =
      totalFrictionLoss(v_pipe, Ktotal);

    /* ===============================
       5. ENERGY BALANCE
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
       6. DISPLAY
    =============================== */

    document
      .getElementById("results")
      .classList.remove("hidden");

    document
      .getElementById("pumpPowerValue")
      .textContent = result.Ws.toFixed(3);

  });

});
