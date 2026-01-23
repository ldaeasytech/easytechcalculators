// main.js — UI-only: input mode selection & field enable/disable
// GUARANTEES correct solver mode at all times

import "./if97-test-region4.js";


const tabHelpText = {
  TP: "Enter Temperature and Pressure (most common case).",
  Ph: "Enter Pressure and Enthalpy (energy balance).",
  Ps: "Enter Pressure and Entropy (turbines, compressors).",
  Tx: "Enter Temperature and Quality for saturated mixtures.",
  Px: "Enter Pressure and Quality for saturated mixtures." // ✅ ADDED
};

// Canonical mapping to solver expectations
const MODE_TO_KEYS = {
  TP: ["temperature", "pressure"],
  Ph: ["pressure", "enthalpy"],
  Ps: ["pressure", "entropy"],
  Tx: ["temperature", "quality"],
  Px: ["pressure", "quality"] // ✅ ADDED
};

// Deterministic default
let currentMode = "TP";

/* ============================================================
   INTERNAL helpers
   ============================================================ */

function normalizeMode(mode) {
  if (!MODE_TO_KEYS[mode]) {
    throw new Error(`Invalid input mode: ${mode}`);
  }
  return mode;
}

function getModeFromActiveTab() {
  const activeTab = document.querySelector(
    ".input-tabs .tab.active"
  );

  if (!activeTab) {
    return "TP";
  }

  const mode = activeTab.dataset.mode;
  return normalizeMode(mode);
}

/* ============================================================
   Tab click handling
   ============================================================ */

document.querySelectorAll(".input-tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".input-tabs .tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");

    const mode = normalizeMode(tab.dataset.mode);
    setInputMode(mode);
  });
});

/* ============================================================
   Enable / disable fields by mode
   ============================================================ */

function setInputMode(mode) {
  currentMode = normalizeMode(mode);

  const help = document.getElementById("tabHelp");
  if (help) help.textContent = tabHelpText[currentMode];

  const allFields = [
    "temperature",
    "pressure",
    "enthalpy",
    "entropy",
    "specificVolume", // intentionally unsupported
    "quality"
  ];

  const enabled = MODE_TO_KEYS[currentMode];

  allFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.inputMode = "decimal";
    el.step = "any";

    if (enabled.includes(id)) {
      el.disabled = false;
    } else {
      el.value = "";
      el.disabled = true;
    }
  });

  // Always lock unsupported inverse properties
  const v = document.getElementById("specificVolume");
  if (v) {
    v.value = "";
    v.disabled = true;
  }
}

/* ============================================================
   Public API for app.js (AUTHORITATIVE)
   ============================================================ */

export function getInputMode() {
  // Always re-sync with DOM to avoid stale state
  currentMode = getModeFromActiveTab();
  return currentMode;
}

export function getEnabledKeys() {
  return MODE_TO_KEYS[getInputMode()];
}

/* ============================================================
   Initialization
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const defaultTab = document.querySelector(
    '.input-tabs .tab[data-mode="TP"]'
  );

  if (!defaultTab) {
    throw new Error("TP tab not found in DOM");
  }

  document
    .querySelectorAll(".input-tabs .tab")
    .forEach(t => t.classList.remove("active"));

  defaultTab.classList.add("active");
  setInputMode("TP");
});
