// app.js
// AUTHORITATIVE solver input controller (FIXED)

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
import { estimateConfidence } from "./confidence.js";
import { getInputMode } from "./main.js";

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

    // ✅ SINGLE SOURCE OF TRUTH FOR MODE
    const mode = getInputMode();

    // ✅ Read only inputs valid for the active mode
    const rawInputs = readInputsByMode(mode);

    // ✅ HARD VALIDATION: prevent NaN / zero / empty
    for (const [k, v] of Object.entries(rawInputs)) {
      if (!Number.isFinite(v)) {
        throw new Error(`Invalid or missing input: ${k}`);
      }
    }

    // ✅ Unit conversion (safe even if SI)
    const siInputs = toSI(rawInputs, unitSystem);

    // Validation layer
    const validation = validateState(siInputs);
    renderValidation(validation);
    if (!validation.valid) return;

    // Solve thermodynamic state
    const stateSI = solve(siInputs);

    // Convert back to UI units
    const stateUI = fromSI(stateSI, unitSystem);

    // Confidence estimation
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
   INPUT MODE WHITELIST (AUTHORITATIVE)
   ============================================================ */

function readInputsByMode(mode) {
  const num = id => parseFloat(document.getElementById(id).value);

  switch (mode) {
    case "TP":
      return {
        T: num("temperature"),
        P: num("pressure")
      };

    case "Ph":
      return {
        P: num("pressure"),
        h: num("enthalpy")
      };

    case "Ps":
      return {
        P: num("pressure"),
        s: num("entropy")
      };

    case "Tx":
      return {
        T: num("temperature"),
        x: num("quality")
      };

    default:
      throw new Error(`Unsupported input mode: ${mode}`);
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
    .filter(k => state[k] !== undefined && !Number.isNaN(state[k]))
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
  ["errors", "warnings", "suggestions"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}

function clearResults() {
  const el = document.getElementById("resultsTable");
  if (el) el.innerHTML = "";
}
