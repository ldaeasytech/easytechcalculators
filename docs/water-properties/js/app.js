// app.js
// Application-level UI orchestration (NO PHYSICS)

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
import { unitSets } from "./unitConfig.js";
import { estimateConfidence } from "./confidence.js";
import { compareToIF97 } from "./compare.js";

/* ============================================================
   DOM elements
   ============================================================ */

const form = document.getElementById("calcForm");
const output = document.getElementById("output");
const loading = document.getElementById("loading");

const errorsEl = document.getElementById("errors");
const warningsEl = document.getElementById("warnings");
const suggestionsEl = document.getElementById("suggestions");
const autoFixesEl = document.getElementById("autoFixes");

const unitSelect = document.getElementById("unitSystem");

/* ============================================================
   Unit labels
   ============================================================ */

function updateLabels(system) {
  const labels = unitSets[system];
  for (const key in labels) {
    const el = document.getElementById(`${key}Label`);
    if (el) el.textContent = labels[key];
  }
}

unitSelect.addEventListener("change", () =>
  updateLabels(unitSelect.value)
);
updateLabels(unitSelect.value);

/* ============================================================
   Form submission
   ============================================================ */

form.addEventListener("submit", async e => {
  e.preventDefault();

  clearUI();
  loading.style.display = "block";

  await new Promise(r => setTimeout(r, 10)); // allow spinner paint

  try {
    /* --- Read UI inputs --- */
    const rawInputs = readInputs();

    /* --- Convert to internal units --- */
    const siInputs = toSI(rawInputs, unitSelect.value);

    /* --- Validate --- */
    const validation = validateState(siInputs);
    renderValidation(validation);
    if (!validation.valid) return;

    /* --- Solve --- */
    const stateSI = solve(siInputs);

    /* --- Convert back to UI units --- */
    const stateUI = fromSI(stateSI, unitSelect.value);

    /* --- Confidence estimation --- */
    const confidence = {};
    for (const key in stateUI) {
      confidence[key] = estimateConfidence(key, stateUI.phase);
    }

    /* --- IF97 reference comparison --- */
    const reference = compareToIF97(
      stateSI.T,
      stateSI.P,
      stateSI
    );

    /* --- Display result --- */
    output.textContent = JSON.stringify(
      { ...stateUI, confidence, IF97_reference: reference },
      null,
      2
    );
  } catch (err) {
    errorsEl.textContent = "❌ " + err.message;
  } finally {
    loading.style.display = "none";
  }
});

/* ============================================================
   Helpers
   ============================================================ */

function readInputs() {
  const fields = [
    "temperature",
    "pressure",
    "enthalpy",
    "entropy",
    "specificVolume",
    "quality"
  ];

  const inputs = {};

  for (const id of fields) {
    const el = document.getElementById(id);
    if (!el) continue;

    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      if (id === "temperature") inputs.T = val;
      else if (id === "pressure") inputs.P = val;
      else if (id === "enthalpy") inputs.h = val;
      else if (id === "entropy") inputs.s = val;
      else if (id === "specificVolume") inputs.v = val;
      else if (id === "quality") inputs.x = val;
    }
  }

  return inputs;
}

function renderValidation({ errors, warnings, suggestions, fixes }) {
  errorsEl.innerHTML = errors.map(e => "❌ " + e).join("<br>");
  warningsEl.innerHTML = warnings.map(w => "⚠️ " + w).join("<br>");
  suggestionsEl.innerHTML = suggestions.map(s => "💡 " + s).join("<br>");

  autoFixesEl.innerHTML = "";
  fixes.forEach(fix => {
    const btn = document.createElement("button");
    btn.textContent = fix.label;
    btn.onclick = () => {
      for (const key in fix.action) {
        const el = document.getElementById(key);
        if (el) el.value = fix.action[key];
      }
    };
    autoFixesEl.appendChild(btn);
  });
}

function clearUI() {
  output.textContent = "";
  errorsEl.textContent = "";
  warningsEl.textContent = "";
  suggestionsEl.textContent = "";
  autoFixesEl.innerHTML = "";
}
