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

  initModeFlowHandlers();

  const calculateBtn =
    document.getElementById("calculateBtn");

  calculateBtn.addEventListener("click", () => {

    /* ===============================
       1. READ MODE
    =============================== */

    const activeMode =
      document.querySelector(".mode-tabs .tab.active")
        ?.dataset.mode || "power";

    if (activeMode !== "power") {
      alert("This mode is under development.");
      return;
    }

    /* ===============================
       2. READ INPUTS
    =============================== */

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value);

    const flowValue =
      Number(document.getElementById("flowValue").value);

    const flowUnit =
      document.getElementById("flowUnit").value;

    const flowType =
      getCurrentFlowType();

    const L =
      Number(document.getElementById("pipeLength").value);

    const h_input =
      Number(document.getElementById("deltaZ").value);

    const elevationRelation =
      document.getElementById("elevationRelation").value;

    const elevationRef =
      getElevationReference();

    const sinkVelocity =
      getSinkVelocity();

    /* ===============================
       3. PRESSURE (ATM TOGGLE SUPPORT)
    =============================== */

    const P1_atm =
      document.getElementById("P1_atm")?.checked;

    const P2_atm =
      document.getElementById("P2_atm")?.checked;

    const P1 = P1_atm
      ? 101325
      : Number(document.getElementById("P1").value);

    const P2 = P2_atm
      ? 101325
      : Number(document.getElementById("P2").value);


    /* ===============================
       4. FLOW CONVERSION
    =============================== */

    const flowSI =
      convertFlowToSI(flowValue, flowUnit, flowType);

    const m_flow =
      flowType === "mass"
        ? flowSI
        : flowSI * rho;

    /* ===============================
       5. PIPE GEOMETRY
    =============================== */

    const D =
      getPipeDiameter(PIPE_ID);

    const A =
      Math.PI * D * D / 4;

    const v_pipe =
      m_flow / (rho * A);

    /* ===============================
       6. VELOCITIES & EXIT LOSS
    =============================== */

    // Source liquid velocity (default zero)
    const v1 = 0;

    let v2 = 0;
    let K_exit = 0;

    if (elevationRef === "pipe") {
      // elevation between source and pipe discharge
      v2 = v_pipe;
      K_exit = 0;
    } else {
      // elevation between source and sink
      v2 = sinkVelocity || 0;
      K_exit = 1;
    }

    const h =
      elevationRelation === "above"
        ? h_input
        : -h_input;

    /* ===============================
       7. LOSS COEFFICIENTS
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
        fromTank: true
      });

    const Ktotal =
      Kpipe +
      Kentrance +
      K_exit +
      window.Kf_total;

    /* ===============================
       8. FRICTION LOSS
    =============================== */

    const F_total =
      totalFrictionLoss(v_pipe, Ktotal);

    /* ===============================
       9. ENERGY BALANCE
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
       10. DISPLAY
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
