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
