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

  const tol = 1e-6;
  const maxIter = 1000;

  let Q = 0;
  let step = 0.01; // adaptive search step
  let Qprev = Q;

  function f(Q) {
    return pumpHead(Q) - systemHead(Q);
  }

  // 1️⃣ March forward until sign change
  while (Q < 100) {

    if (f(Qprev) * f(Q) < 0) {
      break;
    }

    Qprev = Q;
    Q += step;
  }

  if (Q >= 100) {
    throw new Error("No intersection found in range.");
  }

  // 2️⃣ Refine with bisection
  let Qmin = Qprev;
  let Qmax = Q;

  for (let i = 0; i < maxIter; i++) {

    const Qmid = (Qmin + Qmax) / 2;
    const fmid = f(Qmid);

    if (Math.abs(fmid) < tol) {
      return Qmid;
    }

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

    const P1_atm = document.getElementById("P1_atm")?.checked;
    const P2_atm = document.getElementById("P2_atm")?.checked;

    const P1 = P1_atm ? 101325 :
      Number(document.getElementById("P1").value);

    const P2 = P2_atm ? 101325 :
      Number(document.getElementById("P2").value);

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

    /* ===============================
   Build Pump Head Function
=============================== */
  let cleanedEq = pumpEq
    .replace(/\^/g, "**")   // convert power operator
    .replace(/Q/g, "(Q)");  // ensure proper substitution
  
  let pumpHead;
  
  try {
    pumpHead = new Function("Q", `return ${cleanedEq};`);
  } catch (err) {
    alert("Invalid pump equation.");
    return;
  }


    const pumpHead = Q =>
      Function("Q", `return ${pumpEq}`)(Q);

    const systemHead = Q => {

      const v = Q / A;

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

    const h_KE = (v2*v2 - v1*v1)/(2*9.81);

    const deltaPressure =
      (P2 - P1) / rho;

    const h_deltP = deltaPressure/9.81;

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

      return staticHead + hf + h_KE + h_deltP;
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
   AUTO PLOT CURVES (Focused View)
===============================

const Qvals = [];
const pumpVals = [];
const systemVals = [];

const Qmax = Q_operating * 2;
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
});*/

/* ===============================
   AUTO PLOT CURVES (Correct XY)
=============================== */

const pumpData = [];
const systemData = [];

const QmaxPlot = Q_operating * 2 || 1;
const stepPlot = QmaxPlot / 200;

for (let Q = 0; Q <= QmaxPlot; Q += stepPlot) {
  pumpData.push({
    x: Q,
    y: pumpHead(Q)
  });

  systemData.push({
    x: Q,
    y: systemHead(Q)
  });
}

const ctx =
  document.getElementById("curveChart").getContext("2d");

if (chartInstance) {
  chartInstance.destroy();
}

chartInstance = new Chart(ctx, {
  type: "line",
  data: {
    datasets: [
      {
        label: "Pump Curve",
        data: pumpData,
        borderWidth: 3,
        borderColor: "#4da6ff",
        fill: false,
        pointRadius: 0,
        tension: 0.25
      },
      {
        label: "System Curve",
        data: systemData,
        borderWidth: 3,
        borderColor: "#ffaa00",
        fill: false,
        pointRadius: 0,
        tension: 0.25
      },
      {
        label: "Operating Point",
        type: "scatter",
        data: [{
          x: Q_operating,
          y: H_operating
        }],
        backgroundColor: "#ffcc00",
        borderColor: "#ffffff",
        borderWidth: 2,
        pointRadius: 8
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: "linear",
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
    },
    plugins: {
      legend: {
        labels: { color: "#ffffff" }
      }
    }
  }
});


  });

});
