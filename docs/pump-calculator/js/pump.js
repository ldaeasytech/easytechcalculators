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
     Hide Diameter Input in Optimize Mode
  =============================== */
const tabs = document.querySelectorAll(".tab");
const calculateBtn = document.getElementById("calculateBtn");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {

    // Switch active class
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const mode = tab.dataset.mode;

    const steelOptions =
      document.getElementById("steelOptions");

    const customField =
      document.getElementById("customDiameterField");

    // Toggle pipe diameter inputs
    if (mode === "optimize") {
      steelOptions.style.display = "none";
      customField.style.display = "none";

      // ✅ Update button label
      calculateBtn.textContent = "Optimize Pipe Size";

    } else if (mode === "power") {
      steelOptions.style.display = "";

      // ✅ Restore button label
      calculateBtn.textContent = "Calculate Pump Power";

    } else {
      calculateBtn.textContent = "Calculate";
    }

  });
});

  /* ===============================
     Toggle Energy Balance Terms and Hydraulic Parameters
  =============================== */

document.querySelectorAll(".collapse-toggle")
  .forEach(el => {
    el.addEventListener("click", () => {
      el.nextElementSibling.classList.toggle("collapsed");
    });
  });

/* ===============================
     Implement displayOptimization()
  =============================== */
let optChartInstance = null;

function displayOptimization(results, optimum) {

  document.getElementById("results")
    .classList.remove("hidden");

  document.getElementById("optimumBlock")
    .classList.remove("hidden");

  // Display optimum nominal size in inches
  document.getElementById("optimumDiameter")
    .textContent =
    optimum.inch + " in";

  const ctx =
    document.getElementById("optChart").getContext("2d");

  if (optChartInstance) {
    optChartInstance.destroy();
  }

  optChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.map(r => r.inch),
      datasets: [{
        label: "Pump Power (kW)",
        data: results.map(r => r.powerKW),
        borderWidth: 2,
        fill: false,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#ffffff"
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Nominal Pipe Diameter (inches)",
            color: "#ffffff"
          },
          ticks: {
            color: "#ffffff"
          }
        },
        y: {
          title: {
            display: true,
            text: "Pump Power (kW)",
            color: "#ffffff"
          },
          ticks: {
            color: "#ffffff"
          }
        }
      }
    }
  });
}

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

  calculateBtn.addEventListener("click", () => {

    /* ===============================
       1. READ MODE
    =============================== */

    const activeMode =
      document.querySelector(".mode-tabs .tab.active")
        ?.dataset.mode || "power";

    if (activeMode === "optimize") {
  runOptimization();
  return;
  }
  
  if (activeMode !== "power") {
    alert("This mode is under development.");
    return;
  }

    /* ===============================
       Shared Flow Determination
    =============================== */
function determineMassFlow(rho) {

  const massValue = massInput.value;
  const volValue  = volInput.value;

  if (massValue.trim() !== "") {
    return convertMassToKgPerSec(
      massValue,
      massUnit.value
    );
  }

  if (volValue.trim() !== "") {
    const Q = convertVolToM3PerSec(
      volValue,
      volUnit.value
    );
    return Q * rho;
  }

  alert("Enter flow rate.");
  throw new Error("No flow.");
}

    

/* ===============================
       Optimization Algorithm
    =============================== */
function runOptimization() {

  const rho = Number(document.getElementById("rho").value);
  const mu  = Number(document.getElementById("mu").value);
  const L   = Number(document.getElementById("pipeLength").value);

  const material = getPipeMaterial();
  const e = PIPE_ROUGHNESS[material];

  const m_flow = determineMassFlow(rho);

  // Nominal pipe sizes in inches
  const nominalInches = [
    0.125, 0.25, 0.375, 0.5, 0.75,
    1, 1.25, 1.5, 2, 2.5,
    3, 3.5, 4, 5, 6,
    8, 10, 12, 14, 16,
    18, 20, 24, 30
  ];

  const results = [];

  let previousPower = Infinity;
  let riseCount = 0;

  for (let inch of nominalInches) {

    const D = inch * 0.0254; // inch → meter

    const A = Math.PI * D * D / 4;
    const v = m_flow / (rho * A);

    const Kpipe = K_pipe({ rho, mu, D, v, L, e });

    const Ktotal =
      Kpipe +
      K_entrance({ fromTank: true }) +
      getTotalFittingsK() +
      1;

    const F_total =
      totalFrictionLoss(v, Ktotal);

    const powerKW =
      pumpPower({
        m_flow,
        v1: 0,
        v2: v,
        h: 0,
        P1: 101325,
        P2: 101325,
        rho,
        F_total
      }).Ws;

    results.push({
      inch,
      D,
      powerKW
    });

    if (powerKW > previousPower) {
      riseCount++;
    } else {
      riseCount = 0;
    }

    if (riseCount >= 5) break;

    previousPower = powerKW;
  }

  const optimum =
    results.reduce((min, r) =>
      r.powerKW < min.powerKW ? r : min
    );

  displayOptimization(results, optimum);
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

const Kfittings =
  getTotalFittingsK();

const Kexit = K_exit;

const Ktotal =
  Kpipe +
  Kentrance +
  Kexit +
  Kfittings;



    /* ===============================
       8. FRICTION LOSS
    =============================== */

    const F_pipe =
  totalFrictionLoss(v_pipe, Kpipe);

const F_entrance =
  totalFrictionLoss(v_pipe, Kentrance);

const F_exit =
  totalFrictionLoss(v_pipe, Kexit);

const F_fittings =
  totalFrictionLoss(v_pipe, Kfittings);

const F_total =
  F_pipe +
  F_entrance +
  F_exit +
  F_fittings;


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

  // Ws is already in kW
const pumpPowerKW = result.Ws;

// Convert kW → hp
const pumpPowerHP = pumpPowerKW * 1.341022;

document
  .getElementById("pumpPowerValue")
  .textContent =
  pumpPowerKW.toFixed(3);

document
  document.getElementById("pumpPowerHP").textContent =
  pumpPowerHP.toFixed(2);


    /* ===============================
       Reynolds Number
    =============================== */

    const Re =
      (rho * v_pipe * D) / mu;

        /* ===============================
       FLOW REGIME
    =============================== */
    
    let flowRegime;
    
    if (Re < 2300) {
      flowRegime = "Laminar";
    } else if (Re >= 2300 && Re <= 4000) {
      flowRegime = "Transitional";
    } else {
      flowRegime = "Turbulent";
    }

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
    <td>Δ Kinetic Energy</td>
    <td>${deltaKE.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Δ Potential Energy</td>
    <td>${deltaPE.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Δ Pressure Energy</td>
    <td>${deltaPressure.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Pipe Friction Loss</td>
    <td>${F_pipe.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Entrance Loss</td>
    <td>${F_entrance.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Exit Loss</td>
    <td>${F_exit.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td>Fittings Loss</td>
    <td>${F_fittings.toFixed(4)}</td>
    <td>J/kg</td>
  </tr>
  <tr>
    <td><strong>Total Friction Loss</strong></td>
    <td><strong>${F_total.toFixed(4)}</strong></td>
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
    <td>Flow Regime</td>
    <td>${flowRegime}</td>
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
