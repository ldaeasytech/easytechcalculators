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

  /* ============================================
     Numerical Solver (Bisection Method)
  ============================================ */

  function solveIntersection(pumpHead, systemHead) {

    let Qmin = 0;
    let Qmax = 5; // m³/s upper guess
    const tol = 1e-6;
    const maxIter = 100;

    function f(Q) {
      return pumpHead(Q) - systemHead(Q);
    }

    if (f(Qmin) * f(Qmax) > 0) {
      throw new Error("No intersection found in search range.");
    }

    for (let i = 0; i < maxIter; i++) {

      const Qmid = (Qmin + Qmax) / 2;
      const fmid = f(Qmid);

      if (Math.abs(fmid) < tol) {
        return Qmid;
      }

      if (f(Qmin) * fmid < 0) {
        Qmax = Qmid;
      } else {
        Qmin = Qmid;
      }
    }

    return (Qmin + Qmax) / 2;
  }

  /* ============================================
     CALCULATE BUTTON
  ============================================ */

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

    const sinkVelocity =
      getSinkVelocity();

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

    /* ============================================
       Pump Curve Function
    ============================================ */

    const pumpHead = Q =>
      Function("Q", `return ${pumpEq}`)(Q);

    /* ============================================
       System Curve Function
    ============================================ */

    const systemHead = Q => {

      const v = Q / A;

      let K_exit = 0;

      if (elevationRef !== "pipe") {
        K_exit = 1;
      }

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

    /* ============================================
       Solve Intersection
    ============================================ */

    let Q_operating;

    try {
      Q_operating =
        solveIntersection(pumpHead, systemHead);
    } catch (err) {
      alert("No intersection found. Adjust equation.");
      return;
    }

    const H_operating =
      pumpHead(Q_operating);

    const v_pipe =
      Q_operating / A;

    /* ============================================
       Display Results
    ============================================ */

    document.getElementById("results")
      .classList.remove("hidden");

    document.getElementById("powerCard")
      .classList.remove("hidden");

    document.getElementById("pumpPowerValue")
      .textContent =
      Q_operating.toFixed(4);

    document.getElementById("pumpPowerHP")
      .textContent =
      H_operating.toFixed(3);

    /* ============================================
       Hydraulic Parameters
    ============================================ */

    const Re =
      (rho * v_pipe * D) / mu;

    let flowRegime;
    if (Re < 2300) flowRegime = "Laminar";
    else if (Re <= 4000) flowRegime = "Transitional";
    else flowRegime = "Turbulent";

    document.getElementById("hydraulicTable").innerHTML = `
      <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
      <tr><td>Operating Flow Rate (Q)</td>
          <td>${Q_operating.toFixed(4)}</td><td>m³/s</td></tr>
      <tr><td>Operating Head</td>
          <td>${H_operating.toFixed(3)}</td><td>m</td></tr>
      <tr><td>Velocity</td>
          <td>${v_pipe.toFixed(4)}</td><td>m/s</td></tr>
      <tr><td>Reynolds Number</td>
          <td>${Re.toExponential(3)}</td><td>—</td></tr>
      <tr><td>Flow Regime</td>
          <td>${flowRegime}</td><td>—</td></tr>
    `;

  });

});
