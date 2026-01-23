// app.js — FINAL, COHERENT WITH SOLVER + IF97
// Stable for saturated liquid, two-phase, and saturated vapor

import "./main.js";

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { fromSI } from "./unitConverter.js";
import { unitSets } from "./unitConfig.js";
import { getInputMode } from "./main.js";

/* ============================================================
   Main form handler
   ============================================================ */

document.getElementById("calcForm").addEventListener("submit", e => {
  e.preventDefault();

  clearMessages();
  clearResults();
  setLoading(true);

  try {
    const unitSystem =
      document.getElementById("unitSystem")?.value ?? "SI";

    const mode = getInputMode();
    const rawInputs = readInputsByMode(mode);

    // Basic numeric validation
    for (const [k, v] of Object.entries(rawInputs)) {
      if (!Number.isFinite(v)) {
        throw new Error(`Invalid or missing input: ${k}`);
      }
    }

    // Domain validation (IF97 units)
    const validation = validateState({
      mode,
      ...rawInputs
    });

    renderValidation(validation);
    if (!validation.valid) return;

    // ---------------------------------------------------------
    // Solver ALWAYS runs in IF97 units (K, MPa, kJ/kg)
    // ---------------------------------------------------------
    const stateIF97 = solve({
      mode,
      ...rawInputs
    });

    // ---------------------------------------------------------
    // Convert OUTPUTS only if NON-SI is selected
    // ---------------------------------------------------------
const stateIF97 = solve({
  mode,
  ...rawInputs
});

// ---------------------------------------------------------
// Map solver symbols → UI-friendly names
// ---------------------------------------------------------
const mappedState = {
  ...stateIF97,
  temperature: stateIF97.T,
  pressure: stateIF97.P
};

// ---------------------------------------------------------
// Convert OUTPUTS only if NON-SI is selected
// ---------------------------------------------------------
const stateUI =
  unitSystem === "SI"
    ? { ...mappedState }
    : fromSI(mappedState, unitSystem);

// Preserve metadata
stateUI.phase = stateIF97.phase;
stateUI.phaseLabel = stateIF97.phaseLabel;
stateUI.inputMode = mode;

renderResults(stateUI, unitSystem);

    // Preserve metadata
    stateUI.phase = stateIF97.phase;
    stateUI.phaseLabel = stateIF97.phaseLabel;
    stateUI.inputMode = mode;

    renderResults(stateUI, unitSystem);

  } catch (err) {
    document.getElementById("errors").textContent =
      "❌ " + (err?.message ?? "Unknown error");
  } finally {
    setLoading(false);
  }
});

/* ============================================================
   Input parsing (IF97 base units)
   ============================================================ */

function readInputsByMode(mode) {
  const num = id =>
    parseFloat(document.getElementById(id)?.value);

  switch (mode) {
    case "TP":
      return {
        temperature: num("temperature"), // K
        pressure: num("pressure")        // MPa
      };

    case "Ph":
      return {
        pressure: num("pressure"),       // MPa
        enthalpy: num("enthalpy")         // kJ/kg
      };

    case "Ps":
      return {
        pressure: num("pressure"),       // MPa
        entropy: num("entropy")           // kJ/kg-K
      };

    case "Tx":
      return {
        temperature: num("temperature"), // K
        quality: num("quality")           // –
      };

    case "Px":
      return {
        pressure: num("pressure"),       // MPa
        quality: num("quality")           // –
      };

    default:
      throw new Error(`Unsupported input mode: ${mode}`);
  }
}

/* ============================================================
   Results rendering
   ============================================================ */

const BASE_FIELDS = [
  "density",
  "specificVolume",
  "enthalpy",
  "entropy",
  "Cp",
  "Cv",
  "viscosity",
  "conductivity"
];

const LABELS = {
  temperature: "Temperature",
  pressure: "Pressure",
  density: "Density",
  specificVolume: "Specific Volume",
  enthalpy: "Enthalpy",
  entropy: "Entropy",
  Cp: "Cp",
  Cv: "Cv",
  viscosity: "Viscosity",
  conductivity: "Thermal Conductivity"
};

function renderResults(state, unitSystem) {
  const container = document.getElementById("resultsTable");
  const units = unitSets[unitSystem];

  // Decide which extra variable to show
  const fields = [...BASE_FIELDS];

  if (state.inputMode === "Tx") {
    fields.unshift("pressure");   // show Psat
  }

  if (state.inputMode === "Px") {
    fields.unshift("temperature"); // show Tsat
  }

  const rows = fields
    .filter(k => Number.isFinite(state[k]))
    .map(k => `
      <tr>
        <td>${LABELS[k]}</td>
        <td>${formatNumber(state[k])}</td>
        <td>${units?.[k]?.unit ?? ""}</td>
      </tr>
    `)
    .join("");

  container.innerHTML = `
    <div class="phase-banner">
      Phase: ${state.phaseLabel}
    </div>

    <div class="result-actions">
      <button onclick="copyResults('tsv')">COPY FOR EXCEL</button>
      <button onclick="copyResults('csv')">COPY CSV</button>
      <button onclick="copyResults('text')">COPY TEXT</button>
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
  const rows = [["Property", "Value", "Unit"]];

  document
    .querySelectorAll(".results-clean tbody tr")
    .forEach(tr => {
      rows.push(
        Array.from(tr.children).map(td => td.textContent.trim())
      );
    });

  const text =
    format === "csv"
      ? rows.map(r => r.join(",")).join("\n")
      : rows.map(r => r.join("\t")).join("\n");

  navigator.clipboard.writeText(text);
};

/* ============================================================
   UI helpers
   ============================================================ */

function formatNumber(x) {
  if (!Number.isFinite(x)) return "—";
  if (Math.abs(x) < 1e-6) return x.toExponential(6);
  return x.toFixed(6);
}

function setLoading(flag) {
  const el = document.getElementById("loading");
  if (el) el.style.display = flag ? "block" : "none";
}

function clearResults() {
  const el = document.getElementById("resultsTable");
  if (el) el.innerHTML = "";
}

function clearMessages() {
  ["errors", "warnings", "suggestions"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}

function renderValidation({ errors, warnings, suggestions }) {
  document.getElementById("errors").innerHTML =
    errors.map(e => "❌ " + e).join("<br>");
  document.getElementById("warnings").innerHTML =
    warnings.map(w => "⚠️ " + w).join("<br>");
  document.getElementById("suggestions").innerHTML =
    suggestions.map(s => "💡 " + s).join("<br>");
}
