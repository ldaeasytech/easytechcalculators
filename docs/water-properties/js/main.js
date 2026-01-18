// main.js
// UI-only: input mode selection & field enable/disable
// Ensures solver always receives valid, intentional inputs

const tabHelpText = {
  TP: "Enter Temperature and Pressure (most common case).",
  Ph: "Enter Pressure and Enthalpy (energy balance).",
  Ps: "Enter Pressure and Entropy (turbines, compressors).",
  Tx: "Enter Temperature and Quality for saturated mixtures."
};

// Track active mode explicitly
let currentMode = "TP";

document.querySelectorAll(".input-tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".input-tabs .tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");

    const mode = tab.dataset.mode;
    if (!tabHelpText[mode]) {
      console.error("Unknown input mode:", mode);
      return;
    }

    setInputMode(mode);
  });
});

function setInputMode(mode) {
  currentMode = mode;

  const help = document.getElementById("tabHelp");
  if (help) help.textContent = tabHelpText[mode];

  const allFields = [
    "temperature",
    "pressure",
    "enthalpy",
    "entropy",
    "specificVolume",
    "quality"
  ];

  const enabledByMode = {
    TP: ["temperature", "pressure"],
    Ph: ["pressure", "enthalpy"],
    Ps: ["pressure", "entropy"],
    Tx: ["temperature", "quality"]
  };

  allFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (enabledByMode[mode].includes(id)) {
      el.disabled = false;
    } else {
      // IMPORTANT: clear value AND prevent submission
      el.value = "";
      el.disabled = true;
    }
  });
}

// Expose current mode for solver/app.js
export function getInputMode() {
  return currentMode;
}

// Initialize default mode explicitly
document.addEventListener("DOMContentLoaded", () => {
  const defaultTab = document.querySelector(
    '.input-tabs .tab[data-mode="TP"]'
  );

  if (defaultTab) {
    defaultTab.classList.add("active");
  }

  setInputMode("TP");
});
