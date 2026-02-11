// modeFlowHandler.js

let currentMode = "power";
let currentFlowType = "mass";
let initialized = false;

export function initModeFlowHandlers() {
  if (initialized) return;
  initialized = true;

  const modeTabs = document.querySelectorAll(".mode-tabs .tab");
  const flowTabs = document.querySelectorAll("[data-flow]");

  modeTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      modeTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentMode = tab.dataset.mode;
    });
  });

  flowTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      flowTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFlowType = tab.dataset.flow;
    });
  });
}

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
