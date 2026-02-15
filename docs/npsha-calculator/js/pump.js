// pump.js  (PUMP POWER MODE ONLY)

import "./uiInit.js";
import "./fittingsHandler.js";
import "./pipeMaterialHandler.js";
import "./schematicHandler.js";

import { pumpPower } from "./energyBalance.js";
import { totalFrictionLoss } from "./frictionLoss.js";
import { K_pipe } from "./frictionPipe.js";
import { K_entrance } from "./entranceExitLoss.js";
import { getTotalFittingsK } from "./fittingsHandler.js";

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

  /* ===============================
     Collapse Toggles
  =============================== */
  document.querySelectorAll(".collapse-toggle")
    .forEach(el => {
      el.addEventListener("click", () => {
        el.nextElementSibling.classList.toggle("collapsed");
      });
    });

  /* ===============================
     Flow Input Mutual Disable
  =============================== */
  const massInput = document.getElementById("massFlow");
  const massUnit  = document.getElementById("massFlowUnit");
  const volInput  = document.getElementById("volFlow");
  const volUnit   = document.getElementById("volFlowUnit");

  function updateFlowState() {
    const hasMass = massInput.value.trim() !== "";
    const hasVol  = volInput.value.trim() !== "";

    volInput.disabled = hasMass;
    volUnit.disabled  = hasMass;

    massInput.disabled = hasVol;
    massUnit.disabled  = hasVol;
  }

  massInput.addEventListener("input", updateFlowState);
  volInput.addEventListener("input", updateFlowState);

  /* ===============================
     Unit Conversion Utilities
  =============================== */
  function convertMassToKgPerSec(value, unit) {
    const v = Number(value);
    switch (unit) {
      case "kg/s": return v;
      case "kg/min": return v / 60;
      case "kg/h": return v / 3600;
      case "lb/s": return v * 0.453592;
      case "lb/min": return v * 0.453592 / 60;
      case "lb/h": return v * 0.453592 / 3600;
      default: return 0;
    }
  }

  function convertVolToM3PerSec(value, unit) {
    const v = Number(value);
    switch (unit) {
      case "m3/s": return v;
      case "m3/h": return v / 3600;
      case "L/s": return v / 1000;
      case "L/min": return v / 1000 / 60;
      case "ft3/s": return v * 0.0283168;
      case "ft3/min": return v * 0.0283168 / 60;
      case "gpm": return v * 0.00378541 / 60;
      default: return 0;
    }
  }

  /* ===============================
     CALCULATE BUTTON
  =============================== */

  document.getElementById("calculateBtn")
    .addEventListener("click", () => {

    /* ===============================
       1. Read Inputs
    =============================== */

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value) * 1e-6;
    const L   = Number(document.getElementById("pipeLength").value);

    const Pv  = Number(document.getElementById("Pv").value);

    const massValue = massInput.value;
    const massUnitValue = massUnit.value;

    const volValue = volInput.value;
    const volUnitValue = volUnit.value;

    const h_input = Number(document.getElementById("deltaZ").value);

    const elevationRelation =
      document.getElementById("elevationRelation").value;

    const elevationRef = getElevationReference();
    const sinkVelocity = getSinkVelocity();

    const P1_atm = document.getElementById("P1_atm")?.checked;

    const P1 = P1_atm ? 101325 :
      Number(document.getElementById("P1").value);

    /* ===============================
       2. Flow Conversion
    =============================== */

    let m_flow;

    if (massValue.trim() !== "") {
      m_flow = convertMassToKgPerSec(
        massValue,
        massUnitValue
      );
    } else if (volValue.trim() !== "") {
      const Q = convertVolToM3PerSec(
        volValue,
        volUnitValue
      );
      m_flow = Q * rho;
    } else {
      alert("Please enter either mass flow or volumetric flow.");
      return;
    }

    /* ===============================
       3. Pipe Geometry
    =============================== */

    const D = getPipeDiameter(PIPE_ID);
    const A = Math.PI * D * D / 4;
    const v_pipe = m_flow / (rho * A);

    const material = getPipeMaterial();
    const e = PIPE_ROUGHNESS[material];

    /* ===============================
       4. Velocities & Elevation
    =============================== */

    const v1 = 0;

    let v2 = 0;
    let K_exit = 0;

    if (elevationRef === "pipe") {
      v2 = v_pipe;
      K_exit = 0;
    } else {
      v2 = sinkVelocity || 0;
      K_exit = 1;
    }

    const h =
      elevationRelation === "above"
        ? -h_input
        : h_input;

    /* ===============================
       SUCTION LINE LOSSES
    =============================== */

    const Kpipe = K_pipe({ rho, mu, D, v: v_pipe, L, e });
    const Kentrance = K_entrance({ fromTank: true });
    const Kfittings = getTotalFittingsK();

    const Ktotal =
      Kpipe +
      Kentrance +
      Kfittings;

       const Hf =
    totalFrictionLoss(v2, Ktotal) / 9.81; // convert J/kg to meters

    /* ===============================
       6. Friction Loss
    =============================== */

    const F_pipe = totalFrictionLoss(v_pipe, Kpipe);
    const F_entrance = totalFrictionLoss(v_pipe, Kentrance);
    const F_exit = totalFrictionLoss(v_pipe, K_exit);
    const F_fittings = totalFrictionLoss(v_pipe, Kfittings);

    const F_total =
      F_pipe +
      F_entrance +
      F_fittings;

    /* ===============================
     HEAD TERMS
  =============================== */

  const Ha =
    101325 / (rho * 9.81); // atmospheric head

  const Hz =
    elevationRelation === "above"
      ? h_input
      : -h_input;

  const Hvp =
    Pv / (rho * 9.81);

  const NPSHa =
    Ha + Hz - Hf - Hvp;

    /* ===============================
     Recommended NPSHr (Your Image Rule)
  =============================== */

  const NPSHr1 = NPSHa - 1.524; // 5 ft = 1.524 m
  const NPSHr2 = NPSHa / 1.35;

  const recommendedNPSHr =
    Math.min(NPSHr1, NPSHr2);

  /* ===============================
     DISPLAY
  =============================== */

  document.getElementById("results")
    .classList.remove("hidden");

  document.getElementById("NPSHa")
    .textContent = NPSHa.toFixed(3);

  document.querySelector(".power-unit")
    .textContent = "m";

  /* ===============================
     ENERGY TABLE
  =============================== */

  document.getElementById("energyTable").innerHTML = `
    <tr><th>Term</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Atmospheric Head (Ha)</td><td>${Ha.toFixed(3)}</td><td>m</td></tr>
    <tr><td>Static Head (Hz)</td><td>${Hz.toFixed(3)}</td><td>m</td></tr>
    <tr><td>Friction Loss (Hf)</td><td>${Hf.toFixed(3)}</td><td>m</td></tr>
    <tr><td>Vapor Pressure Head (Hvp)</td><td>${Hvp.toFixed(3)}</td><td>m</td></tr>
    <tr><td><strong>NPSH Available</strong></td>
        <td><strong>${NPSHa.toFixed(3)}</strong></td><td>m</td></tr>
  `;

  document.getElementById("hydraulicTable").innerHTML = `
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Velocity</td><td>${v2.toFixed(3)}</td><td>m/s</td></tr>
    <tr><td>Reynolds Number</td>
        <td>${((rho * v * D)/mu).toExponential(3)}</td><td>—</td></tr>
    <tr><td>Recommended NPSHr</td>
        <td>${recommendedNPSHr.toFixed(3)}</td><td>m</td></tr>
  `;

  });

});
