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

import "./pumpEfficiencyHandler.js";
import { getEfficiencyDecimal }
  from "./pumpEfficiencyHandler.js";


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
    const P2_atm = document.getElementById("P2_atm")?.checked;

    const P1 = P1_atm ? 101325 :
      Number(document.getElementById("P1").value);

    const P2 = P2_atm ? 101325 :
      Number(document.getElementById("P2").value);

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
       5. Loss Coefficients
    =============================== */

    const Kpipe = K_pipe({ rho, mu, D, v: v_pipe, L, e });
    const Kentrance = K_entrance({ fromTank: true });
    const Kfittings = getTotalFittingsK();

    const Ktotal =
      Kpipe +
      Kentrance +
      K_exit +
      Kfittings;

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
      F_exit +
      F_fittings;

    /* ===============================
       7. Energy Balance
    =============================== */

    const deltaKE =
      (v2 * v2 - v1 * v1) / 2;

    const deltaPE =
      9.81 * h;

    const deltaPressure =
      (P2 - P1) / rho;

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

const eta = getEfficiencyDecimal();

let actualPower = null;

if (eta && eta > 0) {
  actualPower = result.Ws / eta;
}

    /* ===============================
       8. Display Results
    =============================== */

    document.getElementById("results")
      .classList.remove("hidden");

    document.getElementById("powerCard")
      .classList.remove("hidden");

    const pumpPowerKW = result.Ws;
    const pumpPowerHP = pumpPowerKW * 1.341022;

    const pumpPowerKW_actual = actualPower;
    const pumpPowerHP_actual = pumpPowerKW_actual * 1.341022;

    document.getElementById("pumpPowerValue")
      .textContent = pumpPowerKW.toFixed(3);

    document.getElementById("pumpPowerHP")
      .textContent = pumpPowerHP.toFixed(2);

    document.getElementById("pumpPowerValue_actual")
      .textContent = pumpPowerKW_actual.toFixed(3);

    document.getElementById("pumpPowerHP_actual")
      .textContent = pumpPowerHP_actual.toFixed(2);

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
      <tr>
      <td>Pump Efficiency</td>
      <td>${(eta * 100).toFixed(1)}</td>
      <td>%</td>
    </tr>
    `;

  });

});
