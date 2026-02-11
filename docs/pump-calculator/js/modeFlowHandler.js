// modeFlowHandler.js

let currentMode = "power";
let currentFlowType = "mass";

const modeTabs =
  document.querySelectorAll(".mode-tabs .tab");

const flowTabs =
  document.querySelectorAll("[data-flow]");

const flowUnitSelect =
  document.getElementById("flowUnit");

const flowLabel =
  document.getElementById("flowLabel");

/* ============================
   MODE SELECTION (scoped)
============================ */
modeTabs.forEach(tab => {
  tab.addEventListener("click", () => {

    modeTabs.forEach(t =>
      t.classList.remove("active")
    );

    tab.classList.add("active");
    currentMode = tab.dataset.mode;

  });
});

/* ============================
   FLOW TYPE SELECTION (scoped)
============================ */
flowTabs.forEach(tab => {
  tab.addEventListener("click", () => {

    flowTabs.forEach(t =>
      t.classList.remove("active")
    );

    tab.classList.add("active");

    currentFlowType = tab.dataset.flow;
    updateFlowUI();
  });
});

export function getFlowInSI(rho, pipeArea) {

  const value =
    Number(document.getElementById("flowValue").value);

  const unit =
    document.getElementById("flowUnit").value;

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

    return rho * Q;
  }

  return 0;
}
