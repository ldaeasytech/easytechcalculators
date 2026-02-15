// pump-optimize.js  (PIPE DIAMETER OPTIMIZATION ONLY)

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

import {
  getElevationReference,
  getSinkVelocity
} from "./elevationHandler.js";

import {
  getPipeMaterial
} from "./pipeMaterialHandler.js";

document.addEventListener("DOMContentLoaded", () => {

     const h_input =
      Number(document.getElementById("deltaZ").value);

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
     Optimization Logic
  =============================== */

  document.getElementById("calculateBtn")
    .addEventListener("click", () => {

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value) * 1e-6;
    const L   = Number(document.getElementById("pipeLength").value);

    const electricityRate =
      Number(document.getElementById("electricityRate").value);

    const operatingHours =
      Number(document.getElementById("operatingHours").value);

    const pipeCostIndex =
      Number(document.getElementById("pipeCostIndex").value);

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
      3, 3.5, 4, 5, 6,
      8, 10, 12, 14, 16,
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

      const Kpipe = K_pipe({ rho, mu, D, v, L, e });

      const Ktotal =
        Kpipe +
        K_entrance({ fromTank: true }) +
        getTotalFittingsK() +
        1;

      const F_total = totalFrictionLoss(v, Ktotal);

      const powerKW =
        pumpPower({
          m_flow,
          v1,
          v2,
          h,
          P1,
          P2,
          rho,
          F_total
        }).Ws;

      /* ===============================
         Economic Model
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
  });

  /* ===============================
     Display Optimization
  =============================== */
  
function displayEconomicOptimization(results, optimum) {

    let optChartInstance = null;

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
