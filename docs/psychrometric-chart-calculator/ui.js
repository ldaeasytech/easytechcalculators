import { solvePsychrometrics } from "./solver.js";
import { renderPsychChart } from "./psychrometric-chart.js";

/* =========================================================
   DOM ELEMENTS
========================================================= */

const form = document.getElementById("calcForm");
const tabs = document.querySelectorAll(".tab");
const resultsTable = document.getElementById("resultsTable");
const errorsDiv = document.getElementById("errors");

let activeMode = "T_RH";

/* =========================================================
   TAB SWITCHING
========================================================= */

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeMode = tab.dataset.mode;
    updateFieldState();
    clearMessages();
  });
});

/* =========================================================
   FIELD CONTROL
========================================================= */

function updateFieldState() {

  const fields = ["Tdb","RH","Twb","Tdp","w","h"];

  fields.forEach(id => {
    document.getElementById(id).disabled = true;
  });

  if (activeMode === "T_RH") {
    enable("Tdb","RH");
  }
  else if (activeMode === "T_Twb") {
    enable("Tdb","Twb");
  }
  else if (activeMode === "T_Tdp") {
    enable("Tdb","Tdp");
  }
  else if (activeMode === "T_w") {
    enable("Tdb","w");
  }
  else if (activeMode === "H_RH") {
    enable("h","RH");
  }
}

function enable(...ids) {
  ids.forEach(id => {
    document.getElementById(id).disabled = false;
  });
}

/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener("submit", e => {
  e.preventDefault();
  clearMessages();

  try {
    const inputs = collectInputs();
    const results = solvePsychrometrics(activeMode, inputs);
    renderResults(results);
  } catch (err) {
    showError(err.message);
  }
});

/* =========================================================
   INPUT COLLECTION
========================================================= */

function collectInputs() {

  const get = id => {
    const el = document.getElementById(id);
    if (!el || el.disabled) return undefined;
    return parseFloat(el.value);
  };

  const inputs = {
    Tdb: get("Tdb"),
    RH: get("RH"),
    Twb: get("Twb"),
    Tdp: get("Tdp"),
    w: get("w"),
    h: get("h"),
    pressure: parseFloat(document.getElementById("pressure").value) || 101.325
  };

  validateInputs(inputs);

  return inputs;
}

/* =========================================================
   VALIDATION
========================================================= */

function validateInputs(i) {

  if (activeMode !== "H_RH" && (i.Tdb === undefined || isNaN(i.Tdb)))
    throw new Error("Dry bulb temperature is required.");

  if (activeMode === "T_RH" && (isNaN(i.RH) || i.RH < 0 || i.RH > 100))
    throw new Error("Relative humidity must be between 0 and 100%.");

  if (activeMode === "T_Twb" && isNaN(i.Twb))
    throw new Error("Wet bulb temperature is required.");

  if (activeMode === "T_Tdp" && isNaN(i.Tdp))
    throw new Error("Dew point temperature is required.");

  if (activeMode === "T_w" && isNaN(i.w))
    throw new Error("Humidity ratio is required.");

  if (activeMode === "H_RH" && (isNaN(i.h) || isNaN(i.RH)))
    throw new Error("Enthalpy and RH are required.");

}

/* =========================================================
   RESULTS RENDERING
========================================================= */

function renderResults(r) {

  resultsTable.innerHTML = `
    <table>
      <tr><td>Dry Bulb</td><td>${format(r.dry_bulb)} °C</td></tr>
      <tr><td>Relative Humidity</td><td>${format(r.relative_humidity)} %</td></tr>
      <tr><td>Humidity Ratio</td><td>${format(r.humidity_ratio,6)} kg/kg</td></tr>
      <tr><td>Dew Point</td><td>${format(r.dew_point)} °C</td></tr>
      <tr><td>Wet Bulb</td><td>${format(r.wet_bulb)} °C</td></tr>
      <tr><td>Enthalpy</td><td>${format(r.enthalpy)} kJ/kg dry air</td></tr>
      <tr><td>Specific Volume</td><td>${format(r.specific_volume)} m³/kg</td></tr>
      <tr><td>Vapor Pressure</td><td>${format(r.vapor_pressure)} kPa</td></tr>
      <tr><td>Degree of Saturation</td><td>${format(r.degree_of_saturation)}</td></tr>
    </table>
  `;
   renderPsychChart(r);
}

function format(value, decimals = 3) {
  return Number(value).toFixed(decimals);
}

/* =========================================================
   MESSAGES
========================================================= */

function showError(msg) {
  errorsDiv.textContent = msg;
}

function clearMessages() {
  errorsDiv.textContent = "";
}

/* =========================================================
   INIT
========================================================= */

updateFieldState();
