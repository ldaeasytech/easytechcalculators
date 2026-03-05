// pump-optimize.js  (PIPE DIAMETER OPTIMIZATION ONLY)

import "./uiInit.js";
import "./fittingsHandler.js";
import "./pipeMaterialHandler.js";
import "./schematicHandler.js";
import "./pumpEfficiencyHandler.js";

import { getEfficiencyDecimal }
  from "./pumpEfficiencyHandler.js";

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
  getPipeMaterial
} from "./pipeMaterialHandler.js";


function inchToFraction(inch) {

  const whole = Math.floor(inch);
  const frac = inch - whole;

  const fractions = {
    0.125: "1/8",
    0.25: "1/4",
    0.375: "3/8",
    0.5: "1/2",
    0.625: "5/8",
    0.75: "3/4",
    0.875: "7/8"
  };

  const roundedFrac =
    Math.round(frac * 8) / 8;

  const fracText = fractions[roundedFrac];

  if (!fracText) return `${inch}`;

  if (whole === 0) return fracText;

  return `${whole} ${fracText}`;
}


function findClosestSteelPipe(optimumID) {

  let bestMatch = null;

  for (const nps in PIPE_ID) {

    const schedules = PIPE_ID[nps];

    for (const schedule in schedules) {

      const id = schedules[schedule];

      if (id >= optimumID) {

        if (!bestMatch || id < bestMatch.id) {

          bestMatch = {
            nps,
            schedule,
            id
          };

        }

      }

    }

  }

  return bestMatch;
}

document.addEventListener("DOMContentLoaded", () => {
  let optChartInstance = null;

//Hide Pipe Diameter and Schedule number
    const steelOptions =
      document.getElementById("steelOptions");

    const customField =
      document.getElementById("customDiameterField");

      steelOptions.style.display = "none";
      customField.style.display = "none";
  
  /* ===============================
     Flow Mutual Disable
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
   Economic Mode Toggle
=============================== */

const economicModeSelect =
  document.getElementById("economicMode");

const crfFields =
  document.getElementById("crfFields");

function updateEconomicMode() {

  if (!economicModeSelect || !crfFields) return;

  if (economicModeSelect.value === "crf") {
    crfFields.style.display = "";
  } else {
    crfFields.style.display = "none";
  }

}

updateEconomicMode();

economicModeSelect?.addEventListener(
  "change",
  updateEconomicMode
);

  

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

;

  /* ===============================
     Optimization Logic
  =============================== */

  document.getElementById("calculateBtn")
    .addEventListener("click", () => {

        // GA4 event
  gtag('event', 'calculate', {
    calculator_name: 'optimum_pipe'
  });


  const h_input =
    Number(document.getElementById("deltaZ").value);
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
      : Number(document.getElementById("P2").value)
      
    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value) * 1e-6;
    const L   = Number(document.getElementById("pipeLength").value);

    const electricityRate =
      Number(document.getElementById("electricityRate").value);

    const operatingHours =
      Number(document.getElementById("operatingHours").value);

    const pipeCostIndex =
      Number(document.getElementById("pipeCostIndex").value);

      const economicMode =
  document.getElementById("economicMode")?.value || "simple";

const interestRate =
  Number(document.getElementById("interestRate")?.value) / 100;

const projectLife =
  Number(document.getElementById("projectLife")?.value) || 10;

    /* ===============================
       Flow Conversion
    =============================== */

    let m_flow;

    if (massInput.value.trim() !== "") {
      m_flow = convertMassToKgPerSec(
        massInput.value,
        massUnit.value
      );
    } else if (volInput.value.trim() !== "") {
      const Q = convertVolToM3PerSec(
        volInput.value,
        volUnit.value
      );
      m_flow = Q * rho;
    } else {
      alert("Enter flow rate.");
      return;
    }

    const material = getPipeMaterial();
     
    const e = PIPE_ROUGHNESS[material];

  const nominalInches = [
  0.125, 0.25, 0.375, 0.5, 0.75,
  1, 1.25, 1.5, 2, 2.5,
  3, 3.5, 4, 4.5, 5, 6, 7,
  8, 9, 10, 12, 14, 16,
  18, 20, 24, 30
];

    const results = [];

    const totalFittings =
      Array.from(document.querySelectorAll(".fitting-text"))
        .reduce((sum, el) => {
          const match = el.textContent.match(/^(\d+)/);
          return sum + (match ? Number(match[1]) : 0);
        }, 0);

    for (let inch of nominalInches) {

      const D = inch * 0.0254;
      const A = Math.PI * D * D / 4;
      const v = m_flow / (rho * A);

      /* ===============================
       6. VELOCITIES & EXIT LOSS
    =============================== */

   const elevationRef =
      getElevationReference();

  const sinkVelocity =
      getSinkVelocity();

  const elevationRelation =
      document.getElementById("elevationRelation").value;

    const v1 = 0;

    let v2 = 0;
    let K_exit = 0;

    if (elevationRef === "pipe") {
      v2 = v;
      K_exit = 0;
    } else {
      v2 = sinkVelocity || 0;
      K_exit = 1;
    }

    const h =
      elevationRelation === "above"
        ? -h_input
        : h_input;

      const Kpipe = K_pipe({ rho, mu, D, v, L, e });

      const Ktotal =
        Kpipe +
        K_entrance({ fromTank: true }) +
        getTotalFittingsK() +
        K_exit;

      const F_total = totalFrictionLoss(v, Ktotal);

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

const hydraulicPower = result.Ws;

const eta = getEfficiencyDecimal();

const actualPower =
  eta && eta > 0
    ? hydraulicPower / eta
    : hydraulicPower;
      /* ===============================
         Economic Model
      =============================== */

      // Annual energy cost
  const annualEnergyCost =
  actualPower *
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

  let annualizedCapital;

if (economicMode === "crf") {

  const i = interestRate;
  const n = projectLife;

  const CRF =
    (i * Math.pow(1 + i, n)) /
    (Math.pow(1 + i, n) - 1);

  annualizedCapital =
    totalCapitalCost * CRF;

} else {

  // Simple annuity (original method)
  annualizedCapital =
    totalCapitalCost / projectLife;

}
    const totalAnnualCost =
      annualEnergyCost +
      annualizedCapital;

  const Re = (rho * v * D) / mu;

let flowRegime;
if (Re < 2300) flowRegime = "Laminar";
else if (Re <= 4000) flowRegime = "Transitional";
else flowRegime = "Turbulent";

results.push({
  inch,
  D,
  v,
  Re,
  flowRegime,
  Kpipe,
  Ktotal,
  F_total,
  powerHydraulic: hydraulicPower,
  powerActual: actualPower,
  annualEnergyCost,
  annualizedCapital,
  totalAnnualCost
});

  }


    const optimum =
      results.reduce((min, r) =>
        r.totalAnnualCost < min.totalAnnualCost ? r : min
      );

      let recommendedPipe = null;

      if (material === "Commercial steel") {
        recommendedPipe = findClosestSteelPipe(optimum.D);
      }

    displayEconomicOptimization(results, optimum, recommendedPipe);
    displayOptimumTables(optimum, rho, mu);

  });

  /* ===============================
     Display Optimization
  =============================== */
  
function displayEconomicOptimization(results, optimum, recommendedPipe) {

  document.getElementById("results")
    .classList.remove("hidden");

  document.getElementById("optimumBlock")
    .classList.remove("hidden");

  // Display optimum
let recommendationHTML = "";

if (recommendedPipe) {

  recommendationHTML = `
  <div class="optimum-commercial">
    Recommended Commercial Pipe<br>
    <strong>${recommendedPipe.nps} in – Schedule ${recommendedPipe.schedule.replace(/ST|S|XS/g,"").trim()}</strong><br>
    Inner Diameter: ${(recommendedPipe.id * 1000).toFixed(1)} mm
  </div>
  `;

}

document.getElementById("optimumDiameter")
.innerHTML = `
<div class="optimum-container">

<div class="optimum-label">
OPTIMUM PIPE INNER DIAMETER
</div>

<div class="optimum-value">
${inchToFraction(optimum.inch)} in (${(optimum.D*1000).toFixed(1)} mm)
</div>

<div class="optimum-power">
Actual Pump Power: ${optimum.powerActual.toFixed(3)} kW
(${(optimum.powerActual * 1.341022).toFixed(2)} hp)
</div>

${recommendationHTML}

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
  document.getElementById("optChart")
  ?.getContext("2d");

if (!ctx) return;

  if (optChartInstance) {
    optChartInstance.destroy();
  }

  optChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sliced.map(r => inchToFraction(r.inch)),
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

   function displayOptimumTables(optimum, rho, mu) {

  const energyTable =
    document.getElementById("energyTable");

    const velocityStatus =
  optimum.v < 1
    ? "<span style='color:#4da6ff'>Below economic range</span>"
    : optimum.v > 3
    ? "<span style='color:#ff4d4d'>Above economic range</span>"
    : "<span style='color:#66ff66'>Within economic range</span>";

energyTable.innerHTML = `
<tr>
  <th>Term</th>
  <th>Value</th>
  <th>Unit</th>
</tr>

<tr>
  <td>Pipe Velocity</td>
  <td>${optimum.v.toFixed(4)}</td>
  <td>m/s</td>
</tr>

<tr>
  <td>Economic Velocity Range</td>
  <td>1 – 3</td>
  <td>m/s</td>
</tr>

<tr>
  <td>Velocity Assessment</td>
  <td>${velocityStatus}</td>
  <td>—</td>
</tr>

<tr>
  <td>Total Head Loss</td>
  <td>${optimum.F_total.toFixed(4)}</td>
  <td>J/kg</td>
</tr>

<tr>
  <td>Annual Energy Cost</td>
  <td>${optimum.annualEnergyCost.toFixed(2)}</td>
  <td>$</td>
</tr>

<tr>
  <td>Annualized Capital Cost</td>
  <td>${optimum.annualizedCapital.toFixed(2)}</td>
  <td>$</td>
</tr>

<tr>
  <td>Total Annual Cost</td>
  <td>${optimum.totalAnnualCost.toFixed(2)}</td>
  <td>$</td>
</tr>
`;

  const hydraulicTable =
    document.getElementById("hydraulicTable");

  hydraulicTable.innerHTML = `
    <tr>
      <th>Parameter</th>
      <th>Value</th>
      <th>Unit</th>
    </tr>
    <tr>
      <td>Optimum Diameter</td>
      <td>${optimum.inch}</td>
      <td>in</td>
    </tr>
    <tr>
      <td>Reynolds Number</td>
      <td>${optimum.Re.toExponential(3)}</td>
      <td>—</td>
    </tr>
    <tr>
      <td>Flow Regime</td>
      <td>${optimum.flowRegime}</td>
      <td>—</td>
    </tr>
    <tr>
      <td>Total Loss Coefficient (ΣK)</td>
      <td>${optimum.Ktotal.toFixed(4)}</td>
      <td>—</td>
    </tr>
  `;
}


});
