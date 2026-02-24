import { solvePsychrometrics } from "./solver.js";
import { renderPsychChart } from "./psychrometric-chart.js";

/* =========================================================
   STATE
========================================================= */

let activeMode = "T_RH";

/* =========================================================
   DOM REFERENCES
========================================================= */

const tabs = document.querySelectorAll(".tab");
const calculateBtn = document.querySelector(".primary");

const inputsMap = {
  Tdb: document.getElementById("Tdb"),
  RH: document.getElementById("RH"),
  Twb: document.getElementById("Twb"),
  Tdp: document.getElementById("Tdp"),
  w: document.getElementById("w"),
  h: document.getElementById("h"),
  pressure: document.getElementById("pressure"),
  elevation: document.getElementById("elevation")
};

/* =========================================================
   MODE CONFIGURATION
========================================================= */

const modeFields = {
  T_RH: ["Tdb", "RH"],
  T_Twb: ["Tdb", "Twb"],
  T_Tdp: ["Tdb", "Tdp"],
  T_w: ["Tdb", "w"],
  H_RH: ["h", "RH"]
};

/* =========================================================
   TAB SWITCHING
========================================================= */

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    activeMode = tab.dataset.mode;
    updateFieldState();
  });
});

/* =========================================================
   FIELD CONTROL
========================================================= */

function updateFieldState() {

  const requiredFields = modeFields[activeMode];

  Object.keys(inputsMap).forEach(key => {

    if (key === "pressure" || key === "elevation") return;

    const input = inputsMap[key];

    if (requiredFields.includes(key)) {
      input.disabled = false;
    } else {
      input.value = "";
      input.disabled = true;
    }
  });
}

/* =========================================================
   ELEVATION ↔ PRESSURE LOGIC
========================================================= */

// Standard Atmosphere (kPa)
function pressureFromElevation(h) {
  return 101.325 *
    Math.pow(1 - (0.0065 * h) / 288.15, 5.2559);
}

// If elevation entered → compute pressure
inputsMap.elevation.addEventListener("input", () => {

  const h = parseFloat(inputsMap.elevation.value);

  if (!isNaN(h)) {
    const P = pressureFromElevation(h);
    inputsMap.pressure.value = P.toFixed(3);
    inputsMap.pressure.disabled = true;
  } else {
    inputsMap.pressure.disabled = false;
  }
});

// If pressure entered manually → disable elevation
inputsMap.pressure.addEventListener("input", () => {

  const P = parseFloat(inputsMap.pressure.value);

  if (!isNaN(P)) {
    inputsMap.elevation.value = "";
    inputsMap.elevation.disabled = true;
  } else {
    inputsMap.elevation.disabled = false;
  }
});

/* =========================================================
   CALCULATE
========================================================= */

calculateBtn.addEventListener("click", () => {

  try {

    const data = collectInputs();
    const result = solvePsychrometrics(activeMode, data);

    renderResults(result);
    renderPsychChart(result);

  } catch (err) {
    alert(err.message);
  }

});

/* =========================================================
   COLLECT INPUTS
========================================================= */

function collectInputs() {

  const data = {};
  const required = modeFields[activeMode];

  required.forEach(field => {

    const value = parseFloat(inputsMap[field].value);

    if (isNaN(value)) {
      throw new Error(`Please enter valid value for ${field}.`);
    }

    data[field] = value;
  });

  data.pressure =
    parseFloat(inputsMap.pressure.value) || 101.325;

  return data;
}

/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(r) {

  setValue("dryBulbValue", r.dry_bulb, 2);
  setValue("rhValue", r.relative_humidity, 2);
  setValue("humidityValue", r.humidity_ratio, 6);
  setValue("dpValue", r.dew_point, 2);
  setValue("wbValue", r.wet_bulb, 2);
  setValue("hValue", r.enthalpy, 2);
  setValue("vValue", r.specific_volume, 4);
  setValue("pvValue", r.vapor_pressure, 3);
  setValue("muValue", r.degree_of_saturation, 3);
}

function setValue(id, value, decimals) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = Number(value).toFixed(decimals);
  }
}

/* =========================================================
   INITIALIZE
========================================================= */

updateFieldState();
renderPsychChart(null);
