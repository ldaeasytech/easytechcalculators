import { solvePsychrometrics } from "./solver.js";
import { renderPsychChart } from "./psychrometric-chart.js";

/* =========================================================
   STATE
========================================================= */

let activeMode = "T_RH";
let unitSystem = "SI";

/* =========================================================
   DOM REFERENCES
========================================================= */

const tabs = document.querySelectorAll(".tab");
const calculateBtn = document.querySelector(".primary");
const unitSelect = document.getElementById("unitSystem");

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
   UNIT SWITCHING
========================================================= */

unitSelect.addEventListener("change", () => {
  unitSystem = unitSelect.value;
  updateUnitLabels();
});

/* =========================================================
   FIELD CONTROL
========================================================= */

function updateFieldState() {
  const required = modeFields[activeMode];

  Object.keys(inputsMap).forEach(key => {

    if (key === "pressure" || key === "elevation") return;

    const input = inputsMap[key];

    if (required.includes(key)) {
      input.disabled = false;
    } else {
      input.value = "";
      input.disabled = true;
    }
  });
}

/* =========================================================
   ELEVATION ↔ PRESSURE
========================================================= */

function pressureFromElevation_m(h_m) {
  return 101.325 *
    Math.pow(1 - (0.0065 * h_m) / 288.15, 5.2559);
}

/* =========================================================
   ELEVATION ↔ PRESSURE (SMART SYNC)
========================================================= */

let autoPressureFromElevation = true;

// Standard Atmosphere (kPa)
function pressureFromElevation_m(h_m) {
  return 101.325 *
    Math.pow(1 - (0.0065 * h_m) / 288.15, 5.2559);
}

/* ---- Elevation Input ---- */
inputsMap.elevation.addEventListener("input", () => {

  const raw = inputsMap.elevation.value;
  let h = parseFloat(raw);

  if (!isNaN(h) && autoPressureFromElevation) {

    if (unitSystem === "IP")
      h = h * 0.3048;

    const P_kPa = pressureFromElevation_m(h);

    inputsMap.pressure.value =
      unitSystem === "IP"
        ? (P_kPa / 6.89476).toFixed(3)
        : P_kPa.toFixed(3);

  }
});

/* ---- Pressure Input ---- */
inputsMap.pressure.addEventListener("input", () => {

  const raw = inputsMap.pressure.value;

  if (raw === "") {
    // If pressure cleared → allow auto-sync again
    autoPressureFromElevation = true;
  } else {
    // User manually edited pressure → stop auto-sync
    autoPressureFromElevation = false;
  }
});

/* =========================================================
   CALCULATE
========================================================= */

calculateBtn.addEventListener("click", () => {

  try {

    let data = collectInputs();
    data = convertToSI(data);

    let result = solvePsychrometrics(activeMode, data);
    result = convertFromSI(result);

    renderResults(result);
    renderPsychChart(result, unitSystem);

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

    const val = parseFloat(inputsMap[field].value);
    if (isNaN(val))
      throw new Error(`Please enter valid value for ${field}.`);

    data[field] = val;
  });

  data.pressure =
    parseFloat(inputsMap.pressure.value) || 101.325;

  return data;
}

/* =========================================================
   UNIT CONVERSION
========================================================= */

function convertToSI(data) {

  if (unitSystem === "IP") {

    if (data.Tdb !== undefined)
      data.Tdb = (data.Tdb - 32) * 5/9;

    if (data.Twb !== undefined)
      data.Twb = (data.Twb - 32) * 5/9;

    if (data.Tdp !== undefined)
      data.Tdp = (data.Tdp - 32) * 5/9;

    if (data.h !== undefined)
      data.h *= 2.326;

    if (data.pressure !== undefined)
      data.pressure *= 6.89476;

    if (data.elevation !== undefined)
      data.elevation *= 0.3048;
  }

  return data;
}

function convertFromSI(result) {

  if (unitSystem === "IP") {

    result.dry_bulb = result.dry_bulb * 9/5 + 32;
    result.dew_point = result.dew_point * 9/5 + 32;
    result.wet_bulb = result.wet_bulb * 9/5 + 32;

    result.enthalpy *= 0.429922614;
    result.specific_volume *= 16.018463;
    result.vapor_pressure /= 6.89476;
  }

  return result;
}

/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(r) {

  const tempUnit = unitSystem === "IP" ? "°F" : "°C";
  const hUnit = unitSystem === "IP" ? "Btu/lb" : "kJ/kg";
  const vUnit = unitSystem === "IP" ? "ft³/lb" : "m³/kg";
  const pUnit = unitSystem === "IP" ? "psia" : "kPa";

  setValue("dryBulbValue", r.dry_bulb, 2);
  setValue("rhValue", r.relative_humidity, 2);
  setValue("humidityValue", r.humidity_ratio, 6);
  setValue("dpValue", r.dew_point, 2);
  setValue("wbValue", r.wet_bulb, 2);
  setValue("hValue", r.enthalpy, 2);
  setValue("vValue", r.specific_volume, 4);
  setValue("pvValue", r.vapor_pressure, 3);
  setValue("muValue", r.degree_of_saturation, 3);

  // Optional: dynamically update unit labels in table if needed
}

function setValue(id, value, decimals) {
  const el = document.getElementById(id);
  if (el)
    el.textContent = Number(value).toFixed(decimals);
}

/* =========================================================
   UNIT LABEL UPDATE (OPTIONAL)
========================================================= */

function updateUnitLabels() {
  // If you want dynamic label switching beside inputs,
  // update label innerText here.
}

/* =========================================================
   INIT
========================================================= */

updateFieldState();
renderPsychChart(null, unitSystem);
