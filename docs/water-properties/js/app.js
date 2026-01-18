// app.js
// UI orchestration only — NO PHYSICS

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
import { estimateConfidence } from "./confidence.js";

/* ============================================================
   Form handler
   ============================================================ */

document.getElementById("calcForm").addEventListener("submit", e => {
  e.preventDefault();

  clearMessages();
  clearResults();

  const loading = document.getElementById("loading");
  loading.style.display = "block";

  try {
    // 1️⃣ Read fresh inputs (HARD RESET)
    const rawInputs = readInputs();

    // 2️⃣ Unit conversion
    const unitSystem = document.getElementById("unitSystem").value;
    const siInputs = toSI(rawInputs, unitSystem);

    // 3️⃣ Validation
    const validation = validateState(siInputs);
    renderValidation(validation);
    if (!validation.valid) return;

    // 4️⃣ Solve
    const stateSI = solve(siInputs);

    // 5️⃣ Convert back to UI units
    const stateUI = fromSI(stateSI, unitSystem);

    // 6️⃣ Confidence estimation
    const confidence = {};
    for (const key in stateUI) {
      confidence[key] = estimateConfidence(key, stateUI.phase);
    }

    // 7️⃣ Render results table
    renderResultsTable(stateUI, confidence);
  } catch (err) {
    document.getElementById("errors").textContent =
      "❌ " + err.message;
  } finally {
    loading.style.display = "none";
  }
});

/* ============================================================
   Input handling (CRITICAL FIX)
   ============================================================ */

function readInputs() {
  // HARD RESET — prevents stale values from previous runs
  const data = {};

  const map = {
    temperature: "T",
    pressure: "P",
    enthalpy: "h",
    entropy: "s",
    specificVolume: "v",
    quality: "x"
  };

  for (const id in map) {
    const el = document.getElementById(id);
    if (!el) continue;

    // Only read ENABLED fields
    if (el.disabled) continue;

    const value = parseFloat(el.value);
    if (!isNaN(value)) {
      data[map[id]] = value;
    }
  }

  return data;
}

/* ============================================================
   Results rendering
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
    .filter(key => state[key] !== undefined && isFinite(state[key]))
    .map(key => `
      <tr>
        <td>${labels[key]}</td>
        <td class="value">${format(state[key])}</td>
        <td>${confidence[key]?.confidence_band ?? "—"}</td>
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
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/* ============================================================
   Validation & UI helpers
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
  const table = document.getElementById("resultsTable");
  if (table) table.innerHTML = "";
}

function format(value) {
  return Number(value).toFixed(6);
}
