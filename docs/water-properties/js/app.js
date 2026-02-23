// app.js — FINAL UI LAYER
// Precision-polished, saturation-safe, unit-adaptive

import "./main.js";

import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { fromSI } from "./unitConverter.js";
import { unitSets } from "./unitConfig.js";
import { getInputMode } from "./main.js";

/* ============================================================
   Solver → UI key adapter
   ============================================================ */
function mapSolverToUI(stateSolved) {
  return {
    temperature: stateSolved.temperature,
    pressure: stateSolved.pressure,

    density: stateSolved.rho,
    specificVolume: stateSolved.v,
    enthalpy: stateSolved.h,
    entropy: stateSolved.s,
    cp: stateSolved.cp,
    cv: stateSolved.cv,
    thermalConductivity: stateSolved.k,
    viscosity: stateSolved.mu,

      // 🔹 Preserve special notice messages
    message: stateSolved.message
  };
}

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
}

/* ============================================================
   UNIT DROPDOWNS (PER FIELD)
   ============================================================ */
function populateUnitDropdowns(system) {
  document.querySelectorAll(".unit-select").forEach(sel => {
    const field = sel.dataset.field;
    const options = unitSets[field]?.[system] ?? [];

    sel.innerHTML = options
      .map((u, i) => `<option value="${i}">${u.unit}</option>`)
      .join("");
  });
}

document.getElementById("unitSystem")?.addEventListener("change", e => {
  populateUnitDropdowns(e.target.value);
});

// initial load
populateUnitDropdowns(
  document.getElementById("unitSystem")?.value ?? "SI"
);

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
    const rawInputs = readInputsByMode(mode, unitSystem);

    for (const [k, v] of Object.entries(rawInputs)) {
      if (!Number.isFinite(v)) {
        throw new Error(`Invalid or missing input: ${k}`);
      }
    }

    const validation = validateState({ mode, ...rawInputs });
    renderValidation(validation);
    if (!validation.valid) return;

    // ---- SOLVER (SI ONLY) ----
    const stateSolved = await solve({ mode, ...rawInputs });

    // map solver → UI
    const mapped = mapSolverToUI(stateSolved);

    // convert outputs
    const stateUI =
      unitSystem === "SI" ? mapped : fromSI(mapped, unitSystem);

    // metadata
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
   INPUT PARSING + UNIT → SI
   ============================================================ */
function readInputsByMode(mode, system) {
  const read = id => {
    const val = parseFloat(document.getElementById(id)?.value);
    if (!Number.isFinite(val)) return NaN;

    const sel = document.querySelector(`.unit-select[data-field="${id}"]`);
    if (!sel) return val;

    const u = unitSets[id][system][Number(sel.value)];
    return u.toSI(val);
  };

  switch (mode) {
    case "TP":
      return { temperature: read("temperature"), pressure: read("pressure") };
    case "Ph":
      return { pressure: read("pressure"), enthalpy: read("enthalpy") };
    case "Ps":
      return { pressure: read("pressure"), entropy: read("entropy") };
    case "Tx":
      return { temperature: read("temperature"), quality: read("quality") };
    case "Px":
      return { pressure: read("pressure"), quality: read("quality") };
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

function renderResults(state, unitSystem) {
  const container = document.getElementById("resultsTable");
  const fields = [...BASE_FIELDS];

  if (state.inputMode === "Tx") fields.unshift("pressure");
  if (["Ph", "Ps", "Px"].includes(state.inputMode)) fields.unshift("temperature");

  const rows = fields
    .filter(k => Number.isFinite(state[k]))
    .map(k => `
      <tr>
        <td>${LABELS[k]}</td>
        <td>${formatNumber(state[k], k)}</td>
        <td>${resolveUnit(k, unitSystem)}</td>
      </tr>
    `)
    .join("");

  container.innerHTML = `
    <div class="phase-banner">Phase: ${state.phaseLabel}</div>
    <table class="results-clean">
      <thead>
        <tr><th>Property</th><th>Value</th><th>Unit</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ============================================================
   NUMBER + UNIT FORMAT
   ============================================================ */
function formatNumber(x, key) {
  if (!Number.isFinite(x)) return "—";
  if (key === "viscosity") return x.toFixed(8);
  return Math.abs(x) < 1e-6 ? x.toExponential(6) : x.toFixed(6);
}

function resolveUnit(key, system) {
  const u = unitSets[key]?.[system]?.[0];
  return u?.unit ?? "";
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

/* ============================================================
   TOOLTIP UX (MOBILE + ACCESSIBLE)
   ============================================================ */
function initTooltips() {
  const tooltips = document.querySelectorAll("[data-tooltip]");

  // Tap / click support (mobile)
  document.addEventListener("click", e => {
    let activeTooltip = null;

    tooltips.forEach(tip => {
      if (tip.contains(e.target)) {
        activeTooltip = tip;
      } else {
        tip.classList.remove("active");
      }
    });

    if (activeTooltip) {
      activeTooltip.classList.toggle("active");
    }
  });

  // Keyboard support (Enter / Space)
  document.addEventListener("keydown", e => {
    const el = document.activeElement;
    if (
      el?.dataset?.tooltip !== undefined &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      el.classList.toggle("active");
    }
  });
}

// initialize once DOM is ready
initTooltips();

