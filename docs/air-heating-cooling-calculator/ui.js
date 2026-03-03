import {
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
const unitSelect   = document.getElementById("unitSystem");
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
   MODE MAP
========================================================= */

const modeMap = {
  T_RH:  ["Tdb", "RH"],
  T_Twb: ["Tdb", "Twb"],
  T_Tdp: ["Tdb", "Tdp"],
  T_w:   ["Tdb", "w"],
  H_RH:  ["h", "RH"]
};

/* =========================================================
   UNIT SWITCH HANDLER (SINGLE SOURCE OF TRUTH)
========================================================= */

unitSelect.addEventListener("change", handleUnitChange);

function handleUnitChange() {

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
}

/* =========================================================
   CALCULATE
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
      finalInputs:   convertToSI(finalInputs),
      pressure:      convertPressureToSI(pressure)
    });

    lastResultSI = resultSI;

    renderProcessResults(
      convertFromSIProcess({ ...resultSI })
    );

    setProcessLine(
      resultSI.state1,
      resultSI.state2
    );

    setChartUnitSystem(unitSystem);
    renderPsychChart();

  } catch (err) {
    alert(err.message);
  }
});

/* =========================================================
   INPUT BUILD
========================================================= */

function buildStateInputs(mode, isInitial) {

  if (mode === "T_only" && !isInitial) {
    return { Tdb: parseFloat(inputs.final1.value) };
  }

  const fields = modeMap[mode];
  if (!fields) throw new Error("Invalid mode.");

  const v1 = parseFloat(isInitial ? inputs.init1.value : inputs.final1.value);
  const v2 = parseFloat(isInitial ? inputs.init2.value : inputs.final2.value);

  if (isNaN(v1)) throw new Error("Invalid first input.");

  const obj = {};
  obj[fields[0]] = v1;

  if (fields[1]) {
    if (isNaN(v2)) throw new Error("Invalid second input.");
    obj[fields[1]] = v2;
  }

  return obj;
}

/* =========================================================
   RENDER RESULTS
========================================================= */

function renderProcessResults(r) {

  setValue("processType", r.processType);
  setValue("deltaHValue", r.delta_h, 3);
  setValue("sensibleValue", r.sensibleHeat, 3);
  setValue("condensedValue", r.moistureCondensed, 6);

  setValue("wb1Value", r.state1.wet_bulb, 2);
  setValue("wb2Value", r.state2.wet_bulb, 2);

  setValue("T1Value", r.state1.dry_bulb, 2);
  setValue("RH1Value", r.state1.relative_humidity, 2);
  setValue("w1Value", r.state1.humidity_ratio, 6);
  setValue("h1Value", r.state1.enthalpy, 3);
  setValue("dp1Value", r.state1.dew_point, 2);

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
   AUTO CONVERT INPUTS
========================================================= */

function autoConvertInputs(from, to) {

  if (from === to) return;

  Object.values(inputs).forEach(input => {

    if (!input) return;

    const value = parseFloat(input.value);
    if (isNaN(value)) return;

    if (input === inputs.pressure) {
      input.value =
        from === "SI"
          ? (value / 6.89476).toFixed(3)
          : (value * 6.89476).toFixed(3);
      return;
    }

    if (input === inputs.elevation) {
      input.value =
        from === "SI"
          ? (value / 0.3048).toFixed(2)
          : (value * 0.3048).toFixed(2);
      return;
    }

    input.value =
      from === "SI"
        ? (value * 9/5 + 32).toFixed(2)
        : ((value - 32) * 5/9).toFixed(2);
  });
}

/* =========================================================
   UNIT LABELS
========================================================= */

function updateUnitLabels() {

  const tempUnit = unitSystem === "IP" ? "°F" : "°C";
  const hUnit    = unitSystem === "IP" ? "Btu/lb dry air" : "kJ/kg dry air";
  const wUnit    = unitSystem === "IP" ? "lb/lb dry air" : "kg/kg dry air";

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
setChartUnitSystem(unitSystem);
renderPsychChart();
