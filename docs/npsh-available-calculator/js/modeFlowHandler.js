// modeFlowHandler.js

let currentMode = "power";
let currentFlowType = "mass";
let initialized = false;

export function initModeFlowHandlers() {
  if (initialized) return;
  initialized = true;

  const modeTabs = document.querySelectorAll(".mode-tabs .tab");
  const flowTabs = document.querySelectorAll("[data-flow]");

  const flowUnitSelect = document.getElementById("flowUnit");
  const flowLabel = document.getElementById("flowLabel");

  /* ===============================
     MODE TABS
  =============================== */
  modeTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      modeTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentMode = tab.dataset.mode;
    });
  });

  /* ===============================
     FLOW TABS
  =============================== */
  flowTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      flowTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      currentFlowType = tab.dataset.flow;

      updateFlowUI();
    });
  });

  /* ===============================
     INITIALIZE UNITS ON LOAD
  =============================== */
  updateFlowUI();


  /* ===============================
     UNIT POPULATOR
  =============================== */
  function updateFlowUI() {

    if (!flowUnitSelect || !flowLabel) return;

    flowUnitSelect.innerHTML = "";

    if (currentFlowType === "mass") {

      flowLabel.textContent = "Mass Flow Rate";

      flowUnitSelect.innerHTML = `
        <option value="kg_s">kg/s</option>
        <option value="kg_min">kg/min</option>
        <option value="kg_h">kg/h</option>
        <option value="lb_s">lb/s</option>
        <option value="lb_min">lb/min</option>
        <option value="lb_h">lb/h</option>
      `;

    } else {

      flowLabel.textContent = "Volumetric Flow Rate";

      flowUnitSelect.innerHTML = `
        <option value="m3_s">m³/s</option>
        <option value="m3_h">m³/h</option>
        <option value="L_s">L/s</option>
        <option value="L_min">L/min</option>
        <option value="ft3_s">ft³/s</option>
        <option value="ft3_min">ft³/min</option>
        <option value="gpm">gpm</option>
      `;
    }
  }
}

/* ===============================
   EXPORTS
=============================== */

export function getCurrentFlowType() {
  return currentFlowType;
}

export function convertFlowToSI(value, unit, flowType) {
  if (!value) return 0;

  // MASS → return kg/s
  if (flowType === "mass") {
    switch (unit) {
      case "kg_s": return value;
      case "kg_min": return value / 60;
      case "kg_h": return value / 3600;
      case "lb_s": return value * 0.453592;
      case "lb_min": return value * 0.453592 / 60;
      case "lb_h": return value * 0.453592 / 3600;
    }
  }

  // VOLUMETRIC → return m³/s
  switch (unit) {
    case "m3_s": return value;
    case "m3_h": return value / 3600;
    case "L_s": return value / 1000;
    case "L_min": return value / 1000 / 60;
    case "ft3_s": return value * 0.0283168;
    case "ft3_min": return value * 0.0283168 / 60;
    case "gpm": return value * 0.00006309;
  }

  return 0;
}
