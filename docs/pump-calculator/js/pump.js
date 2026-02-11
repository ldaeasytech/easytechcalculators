// pump.js

import {
  initModeFlowHandlers,
  getCurrentFlowType,
  convertFlowToSI
} from "./modeFlowHandler.js";

import "./uiInit.js";
import "./fittingsHandler.js";
import "./elevationHandler.js";
import "./pipeMaterialHandler.js";
import "./schematicHandler.js";

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


document.addEventListener("DOMContentLoaded", () => {

  // Initialize tabs once
  initModeFlowHandlers();

  const calculateBtn =
    document.getElementById("calculateBtn");

  calculateBtn.addEventListener("click", () => {

    /* ===============================
       1. READ INPUTS (DOM ONLY HERE)
    =============================== */

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value);

    const flowValue =
      Number(document.getElementById("flowValue").value);

    const flowUnit =
      document.getElementById("flowUnit").value;

    const flowType =
      getCurrentFlowType();

    const L  =
      Number(document.getElementById("pipeLength").value);

    const P1 =
      Number(document.getElementById("P1").value);

    const P2 =
      Number(document.getElementById("P2").value);

    const h_input =
      Number(document.getElementById("deltaZ").value);

    const elevationRelation =
      document.getElementById("elevationRelation").value;

    const point1AtTank =
      document.getElementById("point1Tank").checked;

    const point2AtPipeOutlet =
      document.getElementById("point2PipeOutlet").checked;


    /* ===============================
       2. FLOW CONVERSION
    =============================== */

    // Returns:
    //  - kg/s if mass
    //  - m³/s if volumetric
    const flowSI =
      convertFlowToSI(flowValue, flowUnit, flowType);

    const m_flow =
      flowType === "mass"
        ? flowSI
        : flowSI * rho;


    /* ===============================
       3. GEOMETRY & VELOCITIES
    =============================== */

    const D =
      getPipeDiameter(PIPE_ID);

    const A =
      Math.PI * D * D / 4;

    const v1 =
      point1AtTank
        ? 0
        : Number(document.getElementById("v1").value || 0);

    const elevationRef =
      getElevationReference();

    let v2 = 0;
    let KexitAdjustment = 0;

    if (elevationRef === "pipe") {
      v2 = m_flow / (rho * A);
    } else {
      v2 = getSinkVelocity();
      KexitAdjustment = 1;
    }

    const v_pipe =
      m_flow / (rho * A);

    const h =
      elevationRelation === "above"
        ? h_input
        : -h_input;


    /* ===============================
       4. LOSS COEFFICIENTS
    =============================== */

    const material =
      getPipeMaterial();

    const e =
      PIPE_ROUGHNESS[material];

    const Kpipe =
      K_pipe({
        rho,
        mu,
        D,
        v: v_pipe,
        L,
        e
      });

    const Kentrance =
      K_entrance({
        D1: null,
        D2: null,
        fromTank: point1AtTank
      });

    const Ktotal =
      Kpipe +
      Kentrance +
      KexitAdjustment +
      window.Kf_total;


    /* ===============================
       5. FRICTION LOSS
    =============================== */

    const F_total =
      totalFrictionLoss(v_pipe, Ktotal);


    /* ===============================
       6. ENERGY BALANCE
    =============================== */

    const result =
      pumpPower({
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
       7. DISPLAY
    =============================== */

    document
      .getElementById("results")
      .classList.remove("hidden");

    document
      .getElementById("pumpPowerValue")
      .textContent =
      result.Ws.toFixed(3);

  });

});
