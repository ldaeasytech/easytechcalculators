// pump-elevation.js  (REQUIRED TANK ELEVATION MODE ONLY)

import "./uiInit.js";
import "./fittingsHandler.js";
import "./pipeMaterialHandler.js";
import "./schematicHandler.js";

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
     Hide Elevation Group
  =============================== */
  const elevationResult =
  document.getElementById("elevationResult");
    
const elevationGroup =
  document.querySelector(".elevation-group");

const elevationRelationSelect =
  document.getElementById("elevationRelation");

const elevationRefSelect =
  document.getElementById("elevationReference");

const deltaZInput =
  document.getElementById("deltaZ");

 elevationGroup?.classList.add("hidden");


  if (flowSection) flowSection.style.display = "";
  if (tankInputs) tankInputs.classList.add("hidden");
  if (economicSection) economicSection.classList.add("hidden");

  if (elevationRelationSelect) {
    elevationRelationSelect.value = "above";
    elevationRelationSelect.disabled = true;
  }

  if (elevationRefSelect) {
    elevationRefSelect.value = "pipe";
    elevationRefSelect.disabled = true;
  }

  if (deltaZInput) {
    deltaZInput.disabled = true;
    deltaZInput.value = "";
  }

  /* ===============================
     Flow Mutual Disable
  =============================== */

  const massInput = document.getElementById("massFlow");
  const massUnit  = document.getElementById("massFlowUnit");
  const volInput  = document.getElementById("volFlow");
  const volUnit   = document.getElementById("volFlowUnit");

  const elevationGroup =
  document.querySelector(".elevation-group");

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
     Unit Conversion
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

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value) * 1e-6;
    const L   = Number(document.getElementById("pipeLength").value);

    const massValue = massInput.value;
    const massUnitValue = massUnit.value;

    const volValue = volInput.value;
    const volUnitValue = volUnit.value;

    const elevationRelation =
    document.getElementById("elevationRelation").value;

    const elevationRef = getElevationReference();
    const sinkVelocity = getSinkVelocity();
      

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
       Pipe Geometry
    =============================== */

    const D = getPipeDiameter(PIPE_ID);
    const A = Math.PI * D * D / 4;
    const v_pipe = m_flow / (rho * A);

    const material = getPipeMaterial();
    const e = PIPE_ROUGHNESS[material];

    /* ===============================
       Pressure Inputs
    =============================== */

    const P1_atm = document.getElementById("P1_atm")?.checked;
    const P2_atm = document.getElementById("P2_atm")?.checked;

    const P1 = P1_atm ? 101325 :
      Number(document.getElementById("P1").value);

    const P2 = P2_atm ? 101325 :
      Number(document.getElementById("P2").value);

    /* ===============================
       Loss Coefficients
    =============================== */

    const Kpipe = K_pipe({ rho, mu, D, v: v_pipe, L, e });
    const Kentrance = K_entrance({ fromTank: true });
    const Kfittings = getTotalFittingsK();
    const K_exit = 0;

    const Ktotal =
      Kpipe +
      Kentrance +
      K_exit +
      Kfittings;

    const F_pipe = totalFrictionLoss(v_pipe, Kpipe);
    const F_entrance = totalFrictionLoss(v_pipe, Kentrance);
    const F_fittings = totalFrictionLoss(v_pipe, Kfittings);
    const F_exit = totalFrictionLoss(v_pipe, K_exit);

    const F_total =
      F_pipe +
      F_entrance +
      F_fittings +
      F_exit;

    /* ===============================
       Solve for Required Elevation
       h = -(ΔKE + ΔP/ρ + F_total) / g
    =============================== */

    const v1 = 0;
    const v2 = v_pipe;

    const deltaKE =
      (v2 * v2 - v1 * v1) / 2;

    const deltaPressure =
      (P2 - P1) / rho;

    const g = 9.81;

    const h =
      -(deltaKE + deltaPressure + F_total) / g;

    const deltaPE = g * h;

    /* ===============================
       DISPLAY
    =============================== */

    document.getElementById("results")
      .classList.remove("hidden");

    document.getElementById("powerCard")
      .classList.add("hidden");

    document.getElementById("optimumBlock")
      ?.classList.add("hidden");

    document.getElementById("elevationResult")
      ?.classList.remove("hidden");

    document.getElementById("requiredElevationValue")
      .textContent = Math.abs(h).toFixed(4);

    /* ===============================
       Reynolds Number
    =============================== */

    const Re = (rho * v_pipe * D) / mu;

    let flowRegime;
    if (Re < 2300) flowRegime = "Laminar";
    else if (Re <= 4000) flowRegime = "Transitional";
    else flowRegime = "Turbulent";

    /* ===============================
       Energy Table
    =============================== */

    document.getElementById("energyTable").innerHTML = `
      <tr><th>Term</th><th>Value</th><th>Unit</th></tr>
      <tr><td>Mass Flow Rate</td><td>${m_flow.toFixed(4)}</td><td>kg/s</td></tr>
      <tr><td>Δ Kinetic Energy</td><td>${deltaKE.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td>Δ Potential Energy</td><td>${deltaPE.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td>Δ Pressure Energy</td><td>${deltaPressure.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td>Pipe Friction Loss</td><td>${F_pipe.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td>Entrance Loss</td><td>${F_entrance.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td>Exit Loss</td><td>${F_exit.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td>Fittings Loss</td><td>${F_fittings.toFixed(4)}</td><td>J/kg</td></tr>
      <tr><td><strong>Total Friction Loss</strong></td>
          <td><strong>${F_total.toFixed(4)}</strong></td><td>J/kg</td></tr>
    `;

    /* ===============================
       Hydraulic Table
    =============================== */

    document.getElementById("hydraulicTable").innerHTML = `
      <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
      <tr><td>Pipe Diameter (D)</td><td>${D.toFixed(4)}</td><td>m</td></tr>
      <tr><td>Pipe Velocity (v)</td><td>${v_pipe.toFixed(4)}</td><td>m/s</td></tr>
      <tr><td>Reynolds Number</td><td>${Re.toExponential(3)}</td><td>—</td></tr>
      <tr><td>Flow Regime</td><td>${flowRegime}</td><td>—</td></tr>
      <tr><td>Total Loss Coefficient (ΣK)</td><td>${Ktotal.toFixed(4)}</td><td>—</td></tr>
      <tr><td><strong>Required Elevation (Δz)</strong></td>
          <td><strong>${Math.abs(h).toFixed(4)}</strong></td><td>m</td></tr>
    `;

  });

});
