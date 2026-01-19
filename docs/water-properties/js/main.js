// main.js
// UI-only: input mode selection & field enable/disable
// Ensures solver always receives valid, intentional inputs

const tabHelpText = {
  TP: "Enter Temperature and Pressure (most common case).",
  Ph: "Enter Pressure and Enthalpy (energy balance).",
  Ps: "Enter Pressure and Entropy (turbines, compressors).",
  Tx: "Enter Temperature and Quality for saturated mixtures."
};

// Canonical mapping to solver expectations
const MODE_TO_KEYS = {
  TP: ["temperature", "pressure"],
  Ph: ["pressure", "enthalpy"],
  Ps: ["pressure", "entropy"],
  Tx: ["temperature", "quality"]
};

// Track active mode explicitly (deterministic default)
let currentMode = "TP";

/* ============================================================
   Tab click handling
   ============================================================ */

document.querySelectorAll(".input-tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".input-tabs .tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");

    const mode = tab.dataset.mode;
    if (!MODE_TO_KEYS[mode]) {
      console.error("Unknown input mode:", mode);
      return;
    }

    setInputMode(mode);
  });
});

/* ============================================================
   Enable / disable fields by mode
   ============================================================ */

function setInputMode(mode) {
  currentMode = mode;

  const help = document.getElementById("tabHelp");
  if (help) help.textContent = tabHelpText[mode];

  const allFields = [
    "temperature",
    "pressure",
    "enthalpy",
    "entropy",
    "specificVolume", // intentionally unsupported as input
    "quality"
  ];

  const enabled = MODE_TO_KEYS[mode];

  allFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    // Enforce numeric-only input at UI level
    el.inputMode = "decimal";
    el.step = "any";

    if (enabled.includes(id)) {
      el.disabled = false;
    } else {
      el.value = "";
      el.disabled = true;
    }
  });

  // Explicitly lock unsupported inverse properties
  const v = document.getElementById("specificVolume");
  if (v) {
    v.value = "";
    v.disabled = true;
  }
}

/* ============================================================
   Public API for app.js
   ============================================================ */

export function getInputMode() {
  return currentMode;
}

export function getEnabledKeys() {
  return MODE_TO_KEYS[currentMode];
}

/* ============================================================
   Initialization
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const defaultTab = document.querySelector(
    '.input-tabs .tab[data-mode="TP"]'
  );

  if (defaultTab) {
    defaultTab.classList.add("active");
  }

  setInputMode("TP");
});
