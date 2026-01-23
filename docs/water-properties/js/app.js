// app.js — UI ↔ Solver orchestration (CLEAN RESULTS, COPY-FRIENDLY)

import "./main.js";

import { unitSets } from "./unitConfig.js";
import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
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
    const unitSystem =
      document.getElementById("unitSystem")?.value ?? "SI";

    const mode = getInputMode();
    const rawInputs = readInputsByMode(mode);

    for (const [k, v] of Object.entries(rawInputs)) {
      if (!Number.isFinite(v)) {
        throw new Error(`Invalid or missing input: ${k}`);
      }
    }

    const siInputs = toSI(rawInputs, unitSystem);

    const validation = validateState({
      mode,
      ...siInputs
    });

    renderValidation(validation);
    if (!validation.valid) return;

     console.log("DEBUG P to solver (MPa):", siInputs.pressure);

    const stateSI = solve({
      mode,
      ...siInputs
    });

    const stateUI = fromSI(stateSI, unitSystem);
    stateUI.phase = stateSI.phase;
    stateUI.phaseLabel = stateSI.phaseLabel;

    renderResults(stateUI, unitSystem);

  } catch (err) {
    document.getElementById("errors").textContent =
      "❌ " + (err?.message ?? "Unknown error");
  } finally {
    document.getElementById("loading").style.display = "none";
  }
});

/* ============================================================
   Input handling
   ============================================================ */

function readInputsByMode(mode) {
  const num = id =>
    parseFloat(document.getElementById(id)?.value);

  switch (mode) {
    case "TP":
      return { temperature: num("temperature"), pressure: num("pressure") };
    case "Ph":
      return { pressure: num("pressure"), enthalpy: num("enthalpy") };
    case "Ps":
      return { pressure: num("pressure"), entropy: num("entropy") };
    case "Tx":
      return { temperature: num("temperature"), quality: num("quality") };
    case "Px":
      return { pressure: num("pressure"), quality: num("quality") };
    default:
      throw new Error(`Unsupported input mode: ${mode}`);
  }
}

/* ============================================================
   Results rendering
   ============================================================ */

const PROPERTIES = [
  "density",
  "specificVolume",
  "enthalpy",
  "entropy",
  "cp",
  "cv",
  "viscosity",
  "conductivity"
];

const LABELS = {
  density: "Density",
  specificVolume: "Specific Volume",
  enthalpy: "Enthalpy",
  entropy: "Entropy",
  cp: "Cp",
  cv: "Cv",
  viscosity: "Viscosity",
  conductivity: "Thermal Conductivity"
};

function renderResults(state, unitSystem) {
  const container = document.getElementById("resultsTable");
  const units = unitSets[unitSystem];

  const rows = PROPERTIES
    .filter(k => Number.isFinite(state[k]))
    .map(k => {
      const unit = units?.[k]?.unit ?? "";
      return `
        <tr>
          <td>${LABELS[k]}</td>
          <td>${formatNumber(state[k])}</td>
          <td>${unit}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
      <div class="phase-banner">
        Phase: ${state.phaseLabel}
      </div>

    <div class="result-actions">
      <button onclick="copyResults('tsv')">Copy for Excel</button>
      <button onclick="copyResults('csv')">Copy CSV</button>
      <button onclick="copyResults('text')">Copy Text</button>
    </div>

    <table class="results-clean">
      <thead>
        <tr>
          <th>Property</th>
          <th>Value</th>
          <th>Unit</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ============================================================
   Copy helpers
   ============================================================ */

window.copyResults = function (format) {
  const rows = [];
  rows.push(["Property", "Value", "Unit"]);

  document
    .querySelectorAll(".results-clean tbody tr")
    .forEach(tr => {
      rows.push(
        Array.from(tr.children).map(td => td.textContent.trim())
      );
    });

  let text;
  if (format === "csv") {
    text = rows.map(r => r.join(",")).join("\n");
  } else {
    text = rows.map(r => r.join("\t")).join("\n");
  }

  navigator.clipboard.writeText(text);
};

/* ============================================================
   Utilities
   ============================================================ */

function formatNumber(x) {
  if (!Number.isFinite(x)) return "—";
  if (Math.abs(x) < 1e-6) return x.toExponential(6);
  return x.toFixed(6);
}

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
