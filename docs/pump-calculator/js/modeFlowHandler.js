// modeFlowHandler.js

let currentMode = "power";
let currentFlowType = "mass";

const modeTabs = document.querySelectorAll("[data-mode]");
const flowTabs = document.querySelectorAll("[data-flow]");
const flowUnitSelect = document.getElementById("flowUnit");
const flowLabel = document.getElementById("flowLabel");

/* ============================
   MODE SELECTION
============================ */
modeTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    modeTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentMode = tab.dataset.mode;
  });
});

/* ============================
   FLOW TYPE SELECTION
============================ */
flowTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    flowTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    currentFlowType = tab.dataset.flow;
    updateFlowUI();
  });
});

/* ============================
   UNIT OPTIONS
============================ */
function updateFlowUI() {

  flowUnitSelect.innerHTML = "";

  if (currentFlowType === "mass") {

    flowLabel.textContent = "Mass Flow Rate";

    const units = [
      { label: "kg/s", value: "kg_s" },
      { label: "kg/min", value: "kg_min" },
      { label: "kg/h", value: "kg_h" },
      { label: "lbm/s", value: "lb_s" },
      { label: "lbm/min", value: "lb_min" },
      { label: "lbm/h", value: "lb_h" }
    ];

    units.forEach(u => addUnitOption(u));

  } else {

    flowLabel.textContent = "Volumetric Flow Rate";

    const units = [
      { label: "m³/s", value: "m3_s" },
      { label: "m³/h", value: "m3_h" },
      { label: "L/s", value: "L_s" },
      { label: "L/min", value: "L_min" },
      { label: "ft³/s", value: "ft3_s" },
      { label: "ft³/min", value: "ft3_min" },
      { label: "gpm (US)", value: "gpm" }
    ];

    units.forEach(u => addUnitOption(u));
  }
}

function addUnitOption(unit) {
  const opt = document.createElement("option");
  opt.value = unit.value;
  opt.textContent = unit.label;
  flowUnitSelect.appendChild(opt);
}

/* ============================
   UNIT CONVERSION (TO SI)
============================ */
export function getFlowInSI(rho, pipeArea) {

  const value = Number(document.getElementById("flowValue").value);
  const unit = flowUnitSelect.value;

  if (!value) return 0;

  if (currentFlowType === "mass") {

    switch (unit) {
      case "kg_s": return value;
      case "kg_min": return value / 60;
      case "kg_h": return value / 3600;
      case "lb_s": return value * 0.453592;
      case "lb_min": return value * 0.453592 / 60;
      case "lb_h": return value * 0.453592 / 3600;
    }

  } else {

    let Q;

    switch (unit) {
      case "m3_s": Q = value; break;
      case "m3_h": Q = value / 3600; break;
      case "L_s": Q = value / 1000; break;
      case "L_min": Q = value / 1000 / 60; break;
      case "ft3_s": Q = value * 0.0283168; break;
      case "ft3_min": Q = value * 0.0283168 / 60; break;
      case "gpm": Q = value * 0.00006309; break;
    }

    // Convert volumetric to mass flow
    return rho * Q;
  }

  return 0;
}

/* Initialize */
updateFlowUI();
