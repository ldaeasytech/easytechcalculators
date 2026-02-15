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
  getPipeMaterial
} from "./pipeMaterialHandler.js";

document.addEventListener("DOMContentLoaded", () => {

  let optChartInstance = null;

//Hide Pipe Diameter and Schedule number
  const tabs = document.querySelectorAll(".tab");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {

    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const mode = tab.dataset.mode;

    const steelOptions =
      document.getElementById("steelOptions");

    const customField =
      document.getElementById("customDiameterField");

      steelOptions.style.display = "none";
      customField.style.display = "none";
    
  });
});



  
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
          v1: 0,
          v2: v,
          h: 0,
          P1: 101325,
          P2: 101325,
          rho,
          F_total
        }).Ws;

      /* ===============================
         Economic Model
      =============================== */

      const annualEnergyCost =
        powerKW *
        operatingHours *
        electricityRate;

      const pipeCostPerMeter =
        pipeCostIndex *
        Math.pow(inch, 1.8);

      const totalPipeCost =
        pipeCostPerMeter * L;

      const fittingCostPerUnit =
        pipeCostIndex * 0.4 *
        Math.pow(inch, 2);

      const totalFittingCost =
        fittingCostPerUnit *
        totalFittings;

      const totalCapitalCost =
        totalPipeCost +
        totalFittingCost;

      const annualizedCapital =
        totalCapitalCost / 10;

      const totalAnnualCost =
        annualEnergyCost +
        annualizedCapital;

      results.push({
        inch,
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

    displayOptimization(results, optimum);
  });

  /* ===============================
     Display Optimization
  =============================== */

  function displayOptimization(results, optimum) {

    document.getElementById("results")
      .classList.remove("hidden");

    document.getElementById("powerCard")
      ?.classList.add("hidden");

    document.getElementById("elevationResult")
      ?.classList.add("hidden");

    document.getElementById("optimumBlock")
      ?.classList.remove("hidden");

    document.getElementById("optimumDiameter")
      .innerHTML = `
        ${optimum.inch} in
        <br>
        <small>
        Pump Power: ${optimum.powerKW.toFixed(3)} kW
        </small>
      `;

    const ctx =
      document.getElementById("optChart").getContext("2d");

    if (optChartInstance) {
      optChartInstance.destroy();
    }

    optChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: results.map(r => r.inch),
        datasets: [
          {
            label: "Total Annual Cost ($)",
            data: results.map(r => r.totalAnnualCost),
            borderWidth: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: "Nominal Pipe Diameter (inches)"
            }
          },
          y: {
            title: {
              display: true,
              text: "Total Annual Cost ($)"
            }
          }
        }
      }
    });
  }

});
