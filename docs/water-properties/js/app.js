// app.js — FINAL UI LAYER
// Precision-polished, saturation-safe

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
   MODE CHANGE HANDLING
   ============================================================ */

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activateMode(btn.dataset.mode);
  });
});

function activateMode(mode) {
  document.querySelectorAll(".mode-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );

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

  const hint = document.getElementById("modeHint");
  if (hint) {
    hint.textContent =
      mode === "Tx"
        ? "Enter Temperature and Quality (saturated mixture)."
        : mode === "Px"
        ? "Enter Pressure and Quality (saturated mixture)."
        : "";
  }
}

/* ============================================================
   FORM SUBMIT
   ============================================================ */

document.getElementById("calcForm").addEventListener("submit", async e => {

  e.preventDefault();

  clearMessages();
  clearResults();
  setLoading(true);

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

    const validation = validateState({ mode, ...rawInputs });
    renderValidation(validation);
    if (!validation.valid) return;

    // ---- SOLVER (IF97 / IAPWS UNITS ONLY) ----
    const stateSolved = await solve({ mode, ...rawInputs });

    const mappedState = {
      ...stateSolved,
      temperature: stateSolved.T,
      pressure: stateSolved.P
    };

    const stateUI =
      unitSystem === "SI"
        ? { ...mappedState }
        : fromSI(mappedState, unitSystem);

    stateUI.phase = stateSolved.phase;
    stateUI.phaseLabel = stateSolved.phaseLabel;
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

// 🔧 FIXED: lowercase cp / cv
const BASE_FIELDS = [
  "density",
  "specificVolume",
  "enthalpy",
  "entropy",
  "cp",
  "cv",
  "viscosity",
  "thermalConductivity"
];

const LABELS = {
  temperature: "Temperature",
  pressure: "Pressure",
  density: "Density",
  specificVolume: "Specific Volume",
  enthalpy: "Enthalpy",
  entropy: "Entropy",
  cp: "Cp",
  cv: "Cv",
  viscosity: "Viscosity",
  thermalConductivity: "Thermal Conductivity"
};

console.log("FINAL SOLVER STATE:", stateSolved);

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
        <td>${formatNumber(state[k], k)}</td>
        <td>${resolveUnit(k, units)}</td>
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
   NUMBER FORMATTING
   ============================================================ */

function formatNumber(x, key) {
  if (!Number.isFinite(x)) return "—";

  if (key === "viscosity") {
    return x.toFixed(8);
  }

  return Math.abs(x) < 1e-6
    ? x.toExponential(6)
    : x.toFixed(6);
}

/* ============================================================
   UNIT RESOLUTION
   ============================================================ */

function resolveUnit(key, units) {
  if (key === "thermalConductivity") {
    return "W/(m·K)";
  }
  return units?.[key]?.unit ?? "";
}

/* ============================================================
   UI HELPERS
   ============================================================ */

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

function renderValidation({ errors }) {
  document.getElementById("errors").innerHTML =
    errors.map(e => "❌ " + e).join("<br>");
}
