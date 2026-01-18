/**
 * main.js
 * UI wiring for Water & Steam Properties Calculator
 */

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";

document.addEventListener("DOMContentLoaded", () => {
  const unitSystemSelect = document.getElementById("unitSystem");
  const calculateBtn = document.getElementById("calculateBtn");

  const inputs = {
    temperature: document.getElementById("temperature"),
    pressure: document.getElementById("pressure"),
    enthalpy: document.getElementById("enthalpy"),
    entropy: document.getElementById("entropy"),
    specificVolume: document.getElementById("specificVolume"),
    quality: document.getElementById("quality")
  };

  const outputs = {
    density: document.getElementById("density"),
    specificVolume: document.getElementById("specificVolume"),
    enthalpy: document.getElementById("enthalpy"),
    entropy: document.getElementById("entropy"),
    cp: document.getElementById("cp"),
    cv: document.getElementById("cv"),
    viscosity: document.getElementById("viscosity"),
    thermalConductivity: document.getElementById("thermalConductivity")
  };

  calculateBtn.addEventListener("click", () => {
    const unitSystem = unitSystemSelect.value;

    // --- Collect raw UI inputs ---
    const rawInputs = readInputs(inputs);

    // --- Convert to internal units ---
    const siInputs = toSI(rawInputs, unitSystem);

    // --- Validate ---
    const validation = validateState(siInputs);
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    // --- Solve ---
    let state;
    try {
      state = solve(siInputs);
    } catch (err) {
      alert(err.message);
      return;
    }

    // --- Convert back to UI units ---
    const uiState = fromSI(state, unitSystem);

    // --- Display ---
    displayResults(uiState, outputs);
  });
});

/* ============================================================
   Helpers
   ============================================================ */

function readInputs(fields) {
  const data = {};

  for (const key in fields) {
    const el = fields[key];
    if (!el) continue;

    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      // Map UI names to solver names
      if (key === "temperature") data.T = val;
      else if (key === "pressure") data.P = val;
      else if (key === "enthalpy") data.h = val;
      else if (key === "entropy") data.s = val;
      else if (key === "specificVolume") data.v = val;
      else if (key === "quality") data.x = val;
    }
  }

  return data;
}

function displayResults(state, fields) {
  for (const key in fields) {
    if (!fields[key]) continue;
    fields[key].value = format(state[key]);
  }
}

function format(value) {
  if (value === undefined || value === null || !isFinite(value)) {
    return "—";
  }
  return value.toFixed(5);
}
