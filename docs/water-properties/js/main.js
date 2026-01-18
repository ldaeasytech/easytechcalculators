// main.js
// UI-only: input mode selection & field enable/disable

const tabHelpText = {
  TP: "Enter Temperature and Pressure (most common case).",
  Ph: "Enter Pressure and Enthalpy (energy balance).",
  Ps: "Enter Pressure and Entropy (turbines, compressors).",
  Tx: "Enter Temperature and Quality for saturated mixtures."
};

document.querySelectorAll(".input-tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".input-tabs .tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");
    setInputMode(tab.dataset.mode);
  });
});

function setInputMode(mode) {
  document.getElementById("tabHelp").textContent = tabHelpText[mode];

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
      el.value = "";
      el.disabled = true;
    }
  });
}

// Default mode
setInputMode("TP");
