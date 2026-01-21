// app.js — UI ↔ Solver orchestration (FINAL, MODE-SAFE)

import "./main.js";

import { unitSets } from "./unitConfig.js";
import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
import { estimateConfidence } from "./confidence.js";
import { getInputMode } from "./main.js";

/* ============================================================
   Form handler
   ============================================================ */

document
  .getElementById("calcForm")
  .addEventListener("submit", e => {
    e.preventDefault();

    clearMessages();
    clearResults();
    document.getElementById("loading").style.display = "block";

    try {
      const unitSystem =
        document.getElementById("unitSystem")?.value ?? "SI";

      // 🔒 SINGLE source of truth for mode
      const mode = getInputMode();

      // Read inputs strictly by mode
      const rawInputs = readInputsByMode(mode);

      // Hard numeric validation
      for (const [k, v] of Object.entries(rawInputs)) {
        if (!Number.isFinite(v)) {
          throw new Error(`Invalid or missing input: ${k}`);
        }
      }

      // Normalize inputs
      const canonicalInputs = normalizeInputs(rawInputs);

      // Convert UI → SI
      const siInputs = toSI(canonicalInputs, unitSystem);

      /* ========================================================
         VALIDATION (NO MODE MUTATION)
         ======================================================== */
      const validation = validateState({
        mode,          // pass mode explicitly
        ...siInputs
      });

      renderValidation(validation);
      if (!validation.valid) return;

      /* ========================================================
         SOLVER (AUTHORITATIVE)
         ======================================================== */
      const stateSI = solve({
        mode,          // 🔒 re-inject mode explicitly
        ...siInputs
      });

      /* ========================================================
         UNIT CONVERSION (PASSIVE)
         ======================================================== */
      const stateUI = fromSI(stateSI, unitSystem);

      // 🔒 LOCK phase metadata
      stateUI.phase = stateSI.phase;
      stateUI.phaseLabel = stateSI.phaseLabel;

      /* ========================================================
         CONFIDENCE BANDS
         ======================================================== */
      const confidence = {};
      for (const k of COMPARABLE_PROPERTIES) {
        if (Number.isFinite(stateUI[k])) {
          confidence[k] = estimateConfidence(
            k,
            stateUI.phase
          );
        }
      }

      renderResultsTable(stateUI, confidence);

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
      return {
        temperature: num("temperature"),
        pressure: num("pressure")
      };

    case "Ph":
      return {
        pressure: num("pressure"),
        enthalpy: num("enthalpy")
      };

    case "Ps":
      return {
        pressure: num("pressure"),
        entropy: num("entropy")
      };

    case "Tx":
      return {
        temperature: num("temperature"),
        quality: num("quality")
      };

    default:
      throw new Error(`Unsupported input mode: ${mode}`);
  }
}

/**
 * Removes undefined and non-finite values
 */
function normalizeInputs(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (Number.isFinite(v)) {
      out[k] = v;
    }
  }
  return out;
}

/* ============================================================
   Results table & phase display
   ============================================================ */

const COMPARABLE_PROPERTIES = [
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

function renderResultsTable(state, confidence) {
  const container =
    document.getElementById("resultsTable");

  const unitSystem =
    document.getElementById("unitSystem")?.value ?? "SI";

  const units = unitSets[unitSystem];

  const rows = COMPARABLE_PROPERTIES
    .filter(k => Number.isFinite(state[k]))
    .map(k => {
      const unit = units?.[k]?.unit ?? "";
      return `
        <tr>
          <td>${LABELS[k]}</td>
          <td class="value">
            ${formatNumber(state[k])}
            <span class="unit">${unit}</span>
          </td>
          <td>${confidence[k]?.confidence_band ?? "—"}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${renderPhaseBanner(state)}
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

function renderPhaseBanner(state) {
  if (!state.phaseLabel) return "";
  return `
    <div class="phase-banner">
      Phase: <strong>${state.phaseLabel}</strong>
    </div>
  `;
}

function formatNumber(x) {
  if (!Number.isFinite(x)) return "—";
  if (Math.abs(x) < 1e-6) return x.toExponential(3);
  return x.toFixed(6);
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
