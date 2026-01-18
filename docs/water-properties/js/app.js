// app.js
// AUTHORITATIVE solver input controller

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
import { estimateConfidence } from "./confidence.js";

/* ============================================================
   Determine active input mode
   ============================================================ */

function getInputMode() {
  const active = document.querySelector(".input-tabs .tab.active");
  return active ? active.dataset.mode : "TP";
}

/* ============================================================
   Form handler
   ============================================================ */

document.getElementById("calcForm").addEventListener("submit", e => {
  e.preventDefault();

  clearMessages();
  clearResults();
  document.getElementById("loading").style.display = "block";

  try {
    const unitSystem = document.getElementById("unitSystem").value;
    const mode = getInputMode();

    // 🔒 AUTHORITATIVE INPUT SELECTION
    const rawInputs = readInputsByMode(mode);
    const siInputs = rawInputs; // TEMP: bypass unit conversion


    const validation = validateState(siInputs);
    renderValidation(validation);
    if (!validation.valid) return;

    const stateSI = solve(siInputs);
    const stateUI = fromSI(stateSI, unitSystem);

    const confidence = {};
    for (const k in stateUI) {
      confidence[k] = estimateConfidence(k, stateUI.phase);
    }

    renderResultsTable(stateUI, confidence);
  } catch (err) {
    document.getElementById("errors").textContent =
      "❌ " + err.message;
  } finally {
    document.getElementById("loading").style.display = "none";
  }
});

/* ============================================================
   INPUT MODE WHITELIST (CRITICAL FIX)
   ============================================================ */

function readInputsByMode(mode) {
  const num = id => parseFloat(document.getElementById(id).value);

  switch (mode) {
    case "TP":
      return { T: num("temperature"), P: num("pressure") };

    case "Ph":
      return { P: num("pressure"), h: num("enthalpy") };

    case "Ps":
      return { P: num("pressure"), s: num("entropy") };

    case "Tx":
      return { T: num("temperature"), x: num("quality") };

    default:
      throw new Error("Unknown input mode.");
  }
}

/* ============================================================
   Results table
   ============================================================ */

function renderResultsTable(state, confidence) {
  const container = document.getElementById("resultsTable");

  const labels = {
    density: "Density",
    specificVolume: "Specific Volume",
    enthalpy: "Enthalpy",
    entropy: "Entropy",
    cp: "Cp",
    cv: "Cv",
    viscosity: "Viscosity",
    thermalConductivity: "Thermal Conductivity"
  };

  const rows = Object.keys(labels)
    .filter(k => Number.isFinite(state[k]))
    .map(k => `
      <tr>
        <td>${labels[k]}</td>
        <td class="value">${state[k].toFixed(6)}</td>
        <td>${confidence[k]?.confidence_band ?? "—"}</td>
      </tr>
    `)
    .join("");

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Value</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ============================================================
   UI helpers
   ============================================================ */

function renderValidation({ errors, warnings, suggestions }) {
  document.getElementById("errors").innerHTML =
    errors.map(e => "❌ " + e).join("<br>");
  document.getElementById("warnings").innerHTML =
    warnings.map(w => "⚠️ " + w).join("<br>");
  document.getElementById("suggestions").innerHTML =
    suggestions.map(s => "💡 " + s).join("<br>");
}

function clearMessages() {
  ["errors", "warnings", "suggestions"].forEach(id =>
    document.getElementById(id).innerHTML = ""
  );
}

function clearResults() {
  document.getElementById("resultsTable").innerHTML = "";
}
