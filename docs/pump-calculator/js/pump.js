// pump.js

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
     FLOW INPUT CONTROL
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
     FLOW CONVERSION UTILITIES
  =============================== */

  function convertMassToKgPerSec(value, unit) {
    const v = Number(value);

    switch (unit) {
      case "kg/s":   return v;
      case "kg/min": return v / 60;
      case "kg/h":   return v / 3600;
      case "lb/s":   return v * 0.453592;
      case "lb/min": return v * 0.453592 / 60;
      case "lb/h":   return v * 0.453592 / 3600;
      default: return 0;
    }
  }

  function convertVolToM3PerSec(value, unit) {
    const v = Number(value);

    switch (unit) {
      case "m3/s":    return v;
      case "m3/h":    return v / 3600;
      case "L/s":     return v / 1000;
      case "L/min":   return v / 1000 / 60;
      case "ft3/s":   return v * 0.0283168;
      case "ft3/min": return v * 0.0283168 / 60;
      case "gpm":     return v * 0.00378541 / 60;
      default: return 0;
    }
  }


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

    const massValue = massInput.value;
    const massUnitValue = massUnit.value;

    const volValue = volInput.value;
    const volUnitValue = volUnit.value;

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
      getTotalFittingsK();


    /* ===============================
       8. FRICTION LOSS
    =============================== */

    const F_total =
      totalFrictionLoss(v_pipe, Ktotal);


    /* ===============================
       9. ENERGY BALANCE
    =============================== */
    /* ===============================
   ENERGY TERMS (per unit mass)
=============================== */

const deltaKE =
  (v2 * v2 - v1 * v1) / 2;      // J/kg

const deltaPE =
  9.81 * h;                     // J/kg

const deltaPressure =
  (P2 - P1) / rho;              // J/kg

    
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

    // Convert Watts → hp
    const pumpPowerHP = result.Ws / 745.7;
    
    document
      .getElementById("pumpPowerHP")
      .textContent =
      pumpPowerHP.toFixed(4);


    /* ===============================
       Reynolds Number
    =============================== */

    const Re =
      (rho * v_pipe * D) / mu;


    /* ===============================
       ENERGY BALANCE TABLE
    =============================== */

    const energyTable =
      document.getElementById("energyTable");

    energyTable.innerHTML = `
  <tr>
    <th>Term</th>
    <th>Value</th>
    <th>Unit</th>
  </tr>
  <tr>
    <td>Mass Flow Rate</td>
    <td>${m_flow.toFixed(4)}</td>
    <td>kg/s</td>
  </tr>
  <tr>
    <td>Δ Kinetic Energy (v₂² − v₁²)/2</td>
    <td>${deltaKE.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Δ Potential Energy (g·h)</td>
    <td>${deltaPE.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Δ Pressure Energy (ΔP/ρ)</td>
    <td>${deltaPressure.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Total Friction Loss</td>
    <td>${F_total.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
`;



    /* ===============================
       HYDRAULIC PARAMETERS TABLE
    =============================== */

    const hydraulicTable =
      document.getElementById("hydraulicTable");

    hydraulicTable.innerHTML = `
      <tr>
        <th>Parameter</th>
        <th>Value</th>
        <th>Unit</th>
      </tr>
      <tr>
        <td>Pipe Diameter (D)</td>
        <td>${D.toFixed(4)}</td>
        <td>m</td>
      </tr>
      <tr>
        <td>Pipe Velocity (v)</td>
        <td>${v_pipe.toFixed(4)}</td>
        <td>m/s</td>
      </tr>
      <tr>
        <td>Reynolds Number</td>
        <td>${Re.toExponential(3)}</td>
        <td>—</td>
      </tr>
      <tr>
        <td>Total Loss Coefficient (ΣK)</td>
        <td>${Ktotal.toFixed(4)}</td>
        <td>—</td>
      </tr>
    `;

  });

});
