// pump.js  (ACTUAL FLOW MODE ONLY)

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

  let chartInstance = null;

  function solveIntersection(pumpHead, systemHead) {

    let Qmin = 0;
    let Qmax = 5;
    const tol = 1e-6;

    function f(Q) {
      return pumpHead(Q) - systemHead(Q);
    }

    if (f(Qmin) * f(Qmax) > 0) {
      throw new Error("No intersection found.");
    }

    for (let i = 0; i < 100; i++) {
      const Qmid = (Qmin + Qmax) / 2;
      const fmid = f(Qmid);

      if (Math.abs(fmid) < tol) return Qmid;

      if (f(Qmin) * fmid < 0)
        Qmax = Qmid;
      else
        Qmin = Qmid;
    }

    return (Qmin + Qmax) / 2;
  }

  document.getElementById("calculateBtn")
    .addEventListener("click", () => {

    const rho = Number(document.getElementById("rho").value);
    const mu  = Number(document.getElementById("mu").value) * 1e-6;
    const L   = Number(document.getElementById("pipeLength").value);
    const D   = getPipeDiameter(PIPE_ID);
    const A   = Math.PI * D * D / 4;

    const h_input =
      Number(document.getElementById("deltaZ").value);

    const elevationRelation =
      document.getElementById("elevationRelation").value;

    const elevationRef =
      getElevationReference();

    const material =
      getPipeMaterial();

    const e =
      PIPE_ROUGHNESS[material];

    const pumpEq =
      document.getElementById("pumpCurveEq").value;

    if (!pumpEq) {
      alert("Enter pump curve equation.");
      return;
    }

    const pumpHead = Q =>
      Function("Q", `return ${pumpEq}`)(Q);

    const systemHead = Q => {

      const v = Q / A;

      let K_exit = 0;
      if (elevationRef !== "pipe")
        K_exit = 1;

      const Kpipe =
        K_pipe({ rho, mu, D, v, L, e });

      const Ktotal =
        Kpipe +
        K_entrance({ fromTank: true }) +
        getTotalFittingsK() +
        K_exit;

      const hf =
        totalFrictionLoss(v, Ktotal) / 9.81;

      const staticHead =
        elevationRelation === "above"
          ? -h_input
          : h_input;

      return staticHead + hf;
    };

    let Q_operating;

    try {
      Q_operating =
        solveIntersection(pumpHead, systemHead);
    } catch (err) {
      alert("No intersection found.");
      return;
    }

    const H_operating =
      pumpHead(Q_operating);

    const v_pipe =
      Q_operating / A;

    /* ===============================
       DISPLAY HIGHLIGHT
    =============================== */

    document.getElementById("results")
      .classList.remove("hidden");

    document.getElementById("Q_operating")
      .textContent =
      Q_operating.toFixed(4);

    document.getElementById("H_operating")
      .textContent =
      H_operating.toFixed(3);

    /* ===============================
       HYDRAULIC TABLE
    =============================== */

    const Re =
      (rho * v_pipe * D) / mu;

    let regime;
    if (Re < 2300) regime = "Laminar";
    else if (Re <= 4000) regime = "Transitional";
    else regime = "Turbulent";

    document.getElementById("hydraulicTable").innerHTML = `
      <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
      <tr><td>Velocity</td><td>${v_pipe.toFixed(4)}</td><td>m/s</td></tr>
      <tr><td>Reynolds Number</td><td>${Re.toExponential(3)}</td><td>—</td></tr>
      <tr><td>Flow Regime</td><td>${regime}</td><td>—</td></tr>
    `;

    /* ===============================
       AUTO PLOT CURVES
    =============================== */
/* ===============================
   AUTO PLOT CURVES (Focused View)
=============================== */

const Qvals = [];
const pumpVals = [];
const systemVals = [];

const Qmax = Q_operating * 1.5;
const step = Qmax / 60;

// Build full resolution curves
for (let Q = 0; Q <= Qmax; Q += step) {
  Qvals.push(Q);
  pumpVals.push(pumpHead(Q));
  systemVals.push(systemHead(Q));
}

// Find closest index to operating point
let closestIndex = 0;
let minDiff = Infinity;

Qvals.forEach((Q, i) => {
  const diff = Math.abs(Q - Q_operating);
  if (diff < minDiff) {
    minDiff = diff;
    closestIndex = i;
  }
});

// Slice only 3 before and 3 after
const start = Math.max(0, closestIndex - 3);
const end   = Math.min(Qvals.length, closestIndex + 4);

const Qslice = Qvals.slice(start, end);
const pumpSlice = pumpVals.slice(start, end);
const systemSlice = systemVals.slice(start, end);

const ctx =
  document.getElementById("curveChart").getContext("2d");

if (chartInstance) {
  chartInstance.destroy();
}

chartInstance = new Chart(ctx, {
  type: "line",
  data: {
    labels: Qslice.map(q => q.toFixed(4)),
    datasets: [
      {
        label: "Pump Curve",
        data: pumpSlice,
        borderWidth: 3,
        borderColor: "#4da6ff",
        fill: false
      },
      {
        label: "System Curve",
        data: systemSlice,
        borderWidth: 3,
        borderColor: "#ffaa00",
        fill: false
      },
      {
        label: "Operating Point",
        type: "scatter",
        data: [{
          x: Q_operating.toFixed(4),
          y: H_operating
        }],
        backgroundColor: "#ffcc00",
        pointRadius: 8
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
          text: "Flow Rate (m³/s)",
          color: "#ffffff"
        },
        ticks: { color: "#ffffff" }
      },
      y: {
        title: {
          display: true,
          text: "Head (m)",
          color: "#ffffff"
        },
        ticks: { color: "#ffffff" }
      }
    }
  }
});



  });

});
