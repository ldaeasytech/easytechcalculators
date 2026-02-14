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

/* ===============================
   MODE-SPECIFIC UI CONTROL
=============================== */

const flowSection =
  document.querySelector(".flow-section");

const economicSection =
  document.getElementById("economicSection");

const tankInputs =
  document.getElementById("tankInputs");

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

const steelOptions =
  document.getElementById("steelOptions");

const powerCard =
  document.getElementById("powerCard");

const optimumBlock =
  document.getElementById("optimumBlock");


/* ===== POWER MODE ===== */
if (mode === "power") {

document.getElementById("optimumBlock")
  ?.classList.add("hidden");

steelOptions?.classList.remove("hidden");

   elevationGroup?.classList.remove("hidden");

  document.getElementById("elevationResult")
  ?.classList.add("hidden");

  document.getElementById("powerCard")
  ?.classList.remove("hidden");

  if (flowSection) flowSection.style.display = "";
  if (economicSection)
    economicSection.disabled = true;
  if (economicSection) economicSection.classList.add("hidden");
  if (tankInputs)
    tankInputs.classList.add("hidden");

  if (elevationRelationSelect)
    elevationRelationSelect.disabled = false;

  if (elevationRefSelect)
    elevationRefSelect.disabled = false;

  if (deltaZInput)
    deltaZInput.disabled = false;

  calculateBtn.textContent =
    "Calculate Pump Power";
}


 /* ===== Elevation MODE ===== */ 
else if (mode === "elevation") {

document.getElementById("optimumBlock")
  ?.classList.add("hidden");

steelOptions?.classList.remove("hidden");;

document.getElementById("elevationResult")
  ?.classList.remove("hidden");

  document.getElementById("powerCard")
  ?.classList.add("hidden")
  
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

  calculateBtn.textContent =
    "Calculate Required Elevation";
}

  
/* ===== OPTIMIZE MODE ===== */
else if (mode === "optimize") {

  document.getElementById("optimumBlock")
  ?.classList.remove("hidden");

 steelOptions?.classList.add("hidden");

  document.getElementById("elevationResult")
  ?.classList.add("hidden");

  document.getElementById("powerCard")
  ?.classList.add("hidden");
  
  elevationGroup?.classList.remove("hidden");

  if (flowSection) flowSection.style.display = "";
  if (economicSection)
    economicSection.style.display = "";
  if (tankInputs)
    tankInputs.classList.add("hidden");

  if (elevationRelationSelect)
    elevationRelationSelect.disabled = false;

  if (elevationRefSelect)
    elevationRefSelect.disabled = false;

  if (deltaZInput)
    deltaZInput.disabled = false;

  calculateBtn.textContent =
    "Optimize Pipe Size";
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

function displayEconomicOptimization(results, optimum) {

  // Hide theoretical pump power card
document.getElementById("powerCard")
  .classList.add("hidden");

  document.getElementById("results")
    .classList.remove("hidden");

  document.getElementById("optimumBlock")
    .classList.remove("hidden");

  // Display optimum
  document.getElementById("optimumDiameter")
  .innerHTML = `
    <div class="optimum-container">
      <div class="optimum-label">
        OPTIMUM PIPE SIZE
      </div>
      <div class="optimum-value">
        ${optimum.inch} in
      </div>
      <div class="optimum-power">
        Pump Power: ${optimum.powerKW.toFixed(3)} kW
        (${(optimum.powerKW * 1.341022).toFixed(2)} hp)
      </div>
    </div>
  `;
  const optimumIndex =
    results.findIndex(r => r.inch === optimum.inch);

  const start =
    Math.max(0, optimumIndex - 2);

  const end =
    Math.min(results.length, optimumIndex + 3);

  const sliced =
    results.slice(start, end);

  const ctx =
    document.getElementById("optChart").getContext("2d");

  if (optChartInstance) {
    optChartInstance.destroy();
  }

  optChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sliced.map(r => r.inch),
      datasets: [
  {
    label: "Annual Energy Cost ($)",
    data: sliced.map(r => r.annualEnergyCost),
    borderWidth: 2,
    fill: false,
    borderColor: "#4da6ff",
    pointRadius: 4
  },
  {
    label: "Annualized Capital Cost ($)",
    data: sliced.map(r => r.annualizedCapital),
    borderWidth: 2,
    fill: false,
    borderColor: "#ff4d88",
    pointRadius: 4
  },
  {
    label: "Total Annual Cost ($)",
    data: sliced.map(r => r.totalAnnualCost),
    borderWidth: 3,
    fill: false,
    borderColor: "#ffaa00",
    pointRadius: sliced.map(r =>
      r.inch === optimum.inch ? 8 : 4
    ),
    pointBackgroundColor: sliced.map(r =>
      r.inch === optimum.inch ? "#ffcc00" : "#ffaa00"
    )
  }
]

    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#ffffff" }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Nominal Pipe Diameter (inches)",
            color: "#ffffff"
          },
          ticks: { color: "#ffffff" }
        },
        y: {
          title: {
            display: true,
            text: "Total Annual Cost ($)",
            color: "#ffffff"
          },
          ticks: { color: "#ffffff" },
          suggestedMin: 0
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

  if (activeMode === "elevation") {
  runRequiredElevation();
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
  const mu  = Number(document.getElementById("mu").value)*1e-6;
  const L   = Number(document.getElementById("pipeLength").value);

  const electricityRate =
    Number(document.getElementById("electricityRate").value);

  const operatingHours =
    Number(document.getElementById("operatingHours").value);

  const pipeCostIndex =
    Number(document.getElementById("pipeCostIndex").value);

  const material = getPipeMaterial();
  const e = PIPE_ROUGHNESS[material];

  const m_flow = determineMassFlow(rho);

  // Start from 1/4 inch (removed 1/8)
  const nominalInches = [
    0.125, 0.25, 0.375, 0.5, 0.75,
    1, 1.25, 1.5, 2, 2.5,
    3, 3.5, 4, 5, 6,
    8, 10, 12, 14, 16,
    18, 20, 24, 30
  ];

  const results = [];

  // Get total number of fittings currently added
  const totalFittings =
  Array.from(document.querySelectorAll(".fitting-text"))
    .reduce((sum, el) => {
      const match = el.textContent.match(/^(\d+)/);
      return sum + (match ? Number(match[1]) : 0);
    }, 0);


  for (let inch of nominalInches) {

    const D = inch * 0.0254; // convert to meters

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

    /* ===============================
       ECONOMIC MODEL
    =============================== */

    // Annual energy cost
    const annualEnergyCost =
      powerKW *
      operatingHours *
      electricityRate;

    // Pipe cost scaling (D^1.8)
    const pipeCostPerMeter =
      pipeCostIndex *
      Math.pow(inch, 1.8);

    const totalPipeCost =
      pipeCostPerMeter * L;

    // Fitting cost scaling (D^2)
    const fittingCostPerUnit =
      pipeCostIndex * 0.4 *
      Math.pow(inch, 2);

    const totalFittingCost =
      fittingCostPerUnit *
      totalFittings;

    const totalCapitalCost =
      totalPipeCost +
      totalFittingCost;

    // Annualized over 10 years
    const annualizedCapital =
      totalCapitalCost / 10;

    const totalAnnualCost =
      annualEnergyCost +
      annualizedCapital;

    results.push({
      inch,
      D,
      powerKW,
      annualEnergyCost,
      annualizedCapital,
      totalAnnualCost
    });
  }

  const optimum =
    results.reduce((min, r) =>
      r.totalAnnualCost < min.totalAnnualCost ? r : min
    );

  displayEconomicOptimization(results, optimum);
}


 // ================================
  // Required Elevation Calculation
  // ===============================

function runRequiredElevation() {

  const rho = Number(document.getElementById("rho").value);
  const mu  = Number(document.getElementById("mu").value)*1e-6;
  const L   = Number(document.getElementById("pipeLength").value);

  const material = getPipeMaterial();
  const e = PIPE_ROUGHNESS[material];

  const m_flow = determineMassFlow(rho);

  const D = getPipeDiameter(PIPE_ID);
  const A = Math.PI * D * D / 4;
  const v_pipe = m_flow / (rho * A);

  // LOCKED LOGIC
  const v1 = 0;
  const v2 = v_pipe;
  const K_exit = 0;

  const P1_atm = document.getElementById("P1_atm")?.checked;
  const P2_atm = document.getElementById("P2_atm")?.checked;

  const P1 = P1_atm ? 101325 :
    Number(document.getElementById("P1").value);

  const P2 = P2_atm ? 101325 :
    Number(document.getElementById("P2").value);

  // =========================
  // Loss Coefficients
  // =========================
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
    fromTank: true
  });

  const Kfittings = getTotalFittingsK();

  const Ktotal =
    Kpipe +
    Kentrance +
    K_exit +
    Kfittings;

  const F_total =
    totalFrictionLoss(v_pipe, Ktotal);

  const F_pipe =
  totalFrictionLoss(v_pipe, Kpipe);

const F_entrance =
  totalFrictionLoss(v_pipe, Kentrance);

const F_fittings =
  totalFrictionLoss(v_pipe, Kfittings);

const F_exit =
  totalFrictionLoss(v_pipe, K_exit);

  // =========================
  // Solve for h
  // Energy equation:
  // 0 = ΔKE + g*h + ΔP/ρ + F_total
  // h = -(ΔKE + ΔP/ρ + F_total) / g
  // =========================

  const deltaKE =
    (v2 * v2 - v1 * v1) / 2;

  const deltaPressure =
    (P2 - P1) / rho;

  const g = 9.81;

  const h =
    -(deltaKE + deltaPressure + F_total) / g;

  const deltaPE =
  9.81 * h;


  // =========================
  // Display
  // =========================
    // Hide pump power
  document.getElementById("powerCard")
    .classList.add("hidden");
  
    // Hide optimization
  document.getElementById("optimumBlock")
    ?.classList.add("hidden");
  
  document
      .getElementById("results")
      .classList.remove("hidden");
  
  // Show elevation card

document.getElementById("elevationResult")
  ?.classList.remove("hidden");

// Display required elevation
document.getElementById("requiredElevationValue")
  .textContent = Math.abs(h).toFixed(3);

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

  const Re =
  (rho * v_pipe * D) / mu;

let flowRegime;

if (Re < 2300) {
  flowRegime = "Laminar";
} else if (Re <= 4000) {
  flowRegime = "Transitional";
} else {
  flowRegime = "Turbulent";
}

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
  <tr>
    <td><strong>Required Elevation (Δz)</strong></td>
    <td><strong>${Math.abs(h).toFixed(4)}</strong></td>
    <td>m</td>
  </tr>
`;


}


    
    /* ===============================
       2. READ INPUTS
    =============================== */

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value)*1e-6;

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
        ? -h_input
        : h_input;


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

      // Hide optimization
document.getElementById("optimumBlock")
  ?.classList.add("hidden")

document.getElementById("elevationResult")
  ?.classList.add("hidden");
    
    document
      .getElementById("results")
      .classList.remove("hidden");

    document.getElementById("powerCard")
  .classList.remove("hidden");


  // Ws is already in kW
const pumpPowerKW = result.Ws;

// Convert kW → hp
const pumpPowerHP = pumpPowerKW * 1.341022;

document
  .getElementById("pumpPowerValue")
  .textContent =
  pumpPowerKW.toFixed(3);

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
