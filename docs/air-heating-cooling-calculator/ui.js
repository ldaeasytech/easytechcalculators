import {
  solvePsychrometrics,
  solveHeatingCoolingProcess
} from "./solver.js";

import {
  renderPsychChart,
  setProcessLine,
  setChartUnitSystem
} from "./psychrometric-chart.js";

/* =========================================================
   STATE
========================================================= */

let unitSystem = "SI";
let lastResultSI = null;

/* =========================================================
   DOM REFERENCES
========================================================= */

const calculateBtn = document.getElementById("calculateBtn");
const unitSelect = document.getElementById("unitSystem");

const initialModeSelect = document.getElementById("initialMode");
const finalModeSelect   = document.getElementById("finalMode");

const inputs = {
  init1: document.getElementById("init1"),
  init2: document.getElementById("init2"),
  final1: document.getElementById("final1"),
  final2: document.getElementById("final2"),
  pressure: document.getElementById("pressure"),
  elevation: document.getElementById("elevation")
};

/* =========================================================
   MODE & UNIT LISTENERS
========================================================= */

initialModeSelect.addEventListener("change", updateUnitLabels);

finalModeSelect.addEventListener("change", updateUnitLabels);

/* =========================================================
   MODE FIELD MAP
========================================================= */

const modeMap = {
  T_RH: ["Tdb", "RH"],
  T_Twb: ["Tdb", "Twb"],
  T_Tdp: ["Tdb", "Tdp"],
  T_w: ["Tdb", "w"],
  H_RH: ["h", "RH"]
};

/* =========================================================
   ELEVATION ↔ PRESSURE
========================================================= */

let autoPressureFromElevation = true;

function pressureFromElevation_m(h_m) {
  return 101.325 *
    Math.pow(1 - (0.0065 * h_m) / 288.15, 5.2559);
}

inputs.elevation.addEventListener("input", () => {

  if (!autoPressureFromElevation) return;

  let h = parseFloat(inputs.elevation.value);
  if (isNaN(h)) return;

  if (unitSystem === "IP")
    h *= 0.3048;

  const P_kPa = pressureFromElevation_m(h);

  inputs.pressure.value =
    unitSystem === "IP"
      ? (P_kPa / 6.89476).toFixed(3)
      : P_kPa.toFixed(3);
});

inputs.pressure.addEventListener("input", () => {
  autoPressureFromElevation = inputs.pressure.value === "";
});

/* =========================================================
   UNIT SWITCHING
========================================================= */

unitSelect.addEventListener("change", () => {

  const old = unitSystem;
  unitSystem = unitSelect.value;

  autoConvertInputs(old, unitSystem);
  updateUnitLabels();

  if (lastResultSI) {

    renderProcessResults(
      convertFromSIProcess({ ...lastResultSI })
    );

    setProcessLine(
      lastResultSI.state1,
      lastResultSI.state2
    );

    setChartUnitSystem(unitSystem);
    renderPsychChart();
  }
});
/* =========================================================
   CALCULATE PROCESS
========================================================= */

calculateBtn.addEventListener("click", () => {

  try {

    const initialMode = initialModeSelect.value;
    const finalMode   = finalModeSelect.value;

    const pressure =
      parseFloat(inputs.pressure.value) || 101.325;

    const initialInputs = buildStateInputs(initialMode, true);
    const finalInputs   = buildStateInputs(finalMode, false);

    const resultSI = solveHeatingCoolingProcess({
      initialMode,
      finalMode,
      initialInputs: convertToSI(initialInputs),
      finalInputs: convertToSI(finalInputs),
      pressure: convertPressureToSI(pressure)
    });

    lastResultSI = resultSI;

    const resultDisplay = convertFromSIProcess({ ...resultSI });

    renderProcessResults(resultDisplay);
    setProcessLine(resultSI.state1, resultSI.state2);  // <-- SI ONLY

    setChartUnitSystem(unitSystem);
    renderPsychChart();

  } catch (err) {
    alert(err.message);
  }

});

/* =========================================================
   BUILD INPUT OBJECT
========================================================= */

function buildStateInputs(mode, isInitial) {

  if (mode === "T_only" && !isInitial) {
    return { Tdb: parseFloat(inputs.final1.value) };
  }

  const fields = modeMap[mode];
  if (!fields) throw new Error("Invalid mode.");

  const v1 = parseFloat(isInitial ? inputs.init1.value : inputs.final1.value);
  const v2 = parseFloat(isInitial ? inputs.init2.value : inputs.final2.value);

  if (isNaN(v1))
    throw new Error("Invalid first input.");

  const obj = {};
  obj[fields[0]] = v1;

  if (fields[1]) {
    if (isNaN(v2))
      throw new Error("Invalid second input.");
    obj[fields[1]] = v2;
  }

  return obj;
}

/* =========================================================
   PROCESS RESULT RENDER
========================================================= */

function renderProcessResults(r) {

  // Summary
  setValue("processType", r.processType);
  setValue("deltaHValue", r.delta_h, 3);
  setValue("sensibleValue", r.sensibleHeat, 3);
  setValue("condensedValue", r.moistureCondensed, 6);
    // Wet Bulb
  setValue("wb1Value", r.state1.wet_bulb, 2);
  setValue("wb2Value", r.state2.wet_bulb, 2);

  // State 1
  setValue("T1Value", r.state1.dry_bulb, 2);
  setValue("RH1Value", r.state1.relative_humidity, 2);
  setValue("w1Value", r.state1.humidity_ratio, 6);
  setValue("h1Value", r.state1.enthalpy, 3);
  setValue("dp1Value", r.state1.dew_point, 2);

  // State 2
  setValue("T2Value", r.state2.dry_bulb, 2);
  setValue("RH2Value", r.state2.relative_humidity, 2);
  setValue("w2Value", r.state2.humidity_ratio, 6);
  setValue("h2Value", r.state2.enthalpy, 3);
  setValue("dp2Value", r.state2.dew_point, 2);
}

function setValue(id, value, decimals = null) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent =
    decimals !== null
      ? Number(value).toFixed(decimals)
      : value;
}

/* =========================================================
   SI/IP CONVERSION (PROCESS)
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
  }

  return data;
}

function convertPressureToSI(P) {
  return unitSystem === "IP" ? P * 6.89476 : P;
}

function convertFromSIProcess(r) {

  if (unitSystem === "IP") {

    [r.state1, r.state2].forEach(s => {

      s.dry_bulb = s.dry_bulb * 9/5 + 32;
      s.dew_point = s.dew_point * 9/5 + 32;
      s.wet_bulb = s.wet_bulb * 9/5 + 32; 
      
      s.enthalpy *= 0.429922614;
      s.enthalpy += 7.68;
    });

    r.delta_h *= 0.429922614;
    r.sensibleHeat *= 0.429922614;
  }

  return r;
}

/* =========================================================
   UNIT LABELS
========================================================= */
function updateUnitLabels() {

  const tempUnit = unitSystem === "IP" ? "°F" : "°C";
  const hUnit = unitSystem === "IP" ? "Btu/lb dry air" : "kJ/kg dry air";
  const wUnit = unitSystem === "IP" ? "lb/lb dry air" : "kg/kg dry air";

  const initialMode = document.getElementById("initialMode").value;
  const finalMode = document.getElementById("finalMode").value;

  const labelInit1 = document.getElementById("label-init1");
  const labelInit2 = document.getElementById("label-init2");
  const labelFinal1 = document.getElementById("label-final1");
  const labelFinal2 = document.getElementById("label-final2");

  /* ================= INITIAL MODE ================= */

  if (initialMode === "T_RH") {
    labelInit1.textContent = `Dry Bulb Temperature (${tempUnit})`;
    labelInit2.textContent = "Relative Humidity (%)";
  }

  else if (initialMode === "T_Twb") {
    labelInit1.textContent = `Dry Bulb Temperature (${tempUnit})`;
    labelInit2.textContent = `Wet Bulb Temperature (${tempUnit})`;
  }

  else if (initialMode === "T_Tdp") {
    labelInit1.textContent = `Dry Bulb Temperature (${tempUnit})`;
    labelInit2.textContent = `Dew Point Temperature (${tempUnit})`;
  }

  else if (initialMode === "T_w") {
    labelInit1.textContent = `Dry Bulb Temperature (${tempUnit})`;
    labelInit2.textContent = `Humidity Ratio (${wUnit})`;
  }

  else if (initialMode === "H_RH") {
    labelInit1.textContent = `Enthalpy (${hUnit})`;
    labelInit2.textContent = "Relative Humidity (%)";
  }

  /* ================= FINAL MODE ================= */

  const final2Field = document.getElementById("final2Field");

  if (finalMode === "T_only") {
  
    labelFinal1.textContent = `Final Dry Bulb Temperature (${tempUnit})`;
  
    final2Field.style.display = "none";
    document.getElementById("final2").value = "";
  }

  else if (finalMode === "T_RH") {

  labelFinal1.textContent = `Dry Bulb Temperature (${tempUnit})`;
  labelFinal2.textContent = "Relative Humidity (%)";

  final2Field.style.display = "block";
}

  else if (finalMode === "T_w") {

  labelFinal1.textContent = `Dry Bulb Temperature (${tempUnit})`;
  labelFinal2.textContent = `Humidity Ratio (${wUnit})`;

  final2Field.style.display = "block";
}

  /* ================= RESULT TABLE UNITS ================= */

  document.getElementById("TUnit").textContent = tempUnit;
  document.getElementById("dpUnit").textContent = tempUnit;
  document.getElementById("wbUnit").textContent = tempUnit;

  document.getElementById("hUnit").textContent = hUnit;
  document.getElementById("deltaHUnit").textContent = hUnit;
  document.getElementById("sensibleUnit").textContent = hUnit;

  document.getElementById("wUnit").textContent = wUnit;
  document.getElementById("condensedUnit").textContent = wUnit;
}

/* =========================================================
   INIT
========================================================= */
updateUnitLabels();
renderPsychChart(null, unitSystem);
