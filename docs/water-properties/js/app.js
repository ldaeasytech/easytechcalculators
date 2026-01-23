// app.js — FINAL, UI + IF97 SAFE VERSION
// Restores all input modes and correct output mapping

import "./main.js";

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { fromSI } from "./unitConverter.js";
import { unitSets } from "./unitConfig.js";
import { getInputMode } from "./main.js";

/* ============================================================
   MODE → ACTIVE INPUT FIELDS
   ============================================================ */

const MODE_FIELDS = {
  TP: ["temperature", "pressure"],
  Ph: ["pressure", "enthalpy"],
  Ps: ["pressure", "entropy"],
  Tx: ["temperature", "quality"],
  Px: ["pressure", "quality"]
};

const ALL_FIELDS = [
  "temperature",
  "pressure",
  "enthalpy",
  "entropy",
  "specificVolume",
  "quality"
];

/* ============================================================
   MODE CHANGE HANDLING (CRITICAL)
   ============================================================ */

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    activateMode(mode);
  });
});

function activateMode(mode) {
  // highlight active tab
  document.querySelectorAll(".mode-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );

  // enable / disable inputs
  const active = MODE_FIELDS[mode] || [];

  ALL_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (active.includes(id)) {
      el.disabled = false;
      el.parentElement.classList.remove("disabled");
    } else {
      el.disabled = true;
      el.value = "";
      el.parentElement.classList.add("disabled");
    }
  });

  // update hint text
  const hint = document.getElementById("modeHint");
  if (hint) {
    hint.textContent =
      mode === "Tx"
        ? "Enter Temperature and Quality for saturated mixtures."
        : mode === "Px"
        ? "Enter Pressure and Quality for saturated mixtures."
        : "";
  }
}

/* ============================================================
   FORM SUBMIT
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

    // numeric validation
    for (const [k, v] of Object.entries(rawInputs)) {
      if (!Number.isFinite(v)) {
        throw new Error(`Invalid or missing input: ${k}`);
      }
    }

    const validation = validateState({
      mode,
      ...rawInputs
    });

    renderValidation(validation);
    if (!validation.valid) return;

    // ---- SOLVER (IF97 UNITS ONLY) ----
    const stateIF97 = solve({ mode, ...rawInputs });

    // map solver symbols → UI names
    const mappedState = {
      ...stateIF97,
      temperature: stateIF97.T,
      pressure: stateIF97.P
    };

    // convert ONLY if non-SI
    const stateUI =
      unitSystem === "SI"
        ? { ...mappedState }
        : fromSI(mappedState, unitSystem);

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
   INPUT PARSING
   ============================================================ */

function readInputsByMode(mode) {
  const num = id => parseFloat(document.getElementById(id)?.value);

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
   RESULTS RENDERING
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

  const fields = [...BASE_FIELDS];

  if (state.inputMode === "Tx") fields.unshift("pressure");
  if (state.inputMode === "Px") fields.unshift("temperature");

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
    <table class="results-clean">
      <thead>
        <tr><th>Property</th><th>Value</th><th>Unit</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ============================================================
   UI HELPERS
   ============================================================ */

function formatNumber(x) {
  if (!Number.isFinite(x)) return "—";
  return Math.abs(x) < 1e-6 ? x.toExponential(6) : x.toFixed(6);
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
}
