/**
 * main.js
 * UI wiring for Water & Steam Properties Calculator
 */

import { computeProperties } from "./solver.js";

document.addEventListener("DOMContentLoaded", () => {
  const unitSystemSelect = document.getElementById("unitSystem");
  const phaseSelect = document.getElementById("phaseSelect");
  const calculateBtn = document.getElementById("calculateBtn");

  const inputs = {
    temperature: document.getElementById("temperature"),
    pressure: document.getElementById("pressure"),
    enthalpy: document.getElementById("enthalpy"),
    entropy: document.getElementById("entropy"),
    density: document.getElementById("density"),
    specificVolume: document.getElementById("specificVolume"),
    cp: document.getElementById("cp"),
    cv: document.getElementById("cv"),
    viscosity: document.getElementById("viscosity"),
    thermalConductivity: document.getElementById("thermalConductivity"),
  };

  calculateBtn.addEventListener("click", () => {
    const T = parseFloat(inputs.temperature.value);
    const P = parseFloat(inputs.pressure.value);
    const phase = phaseSelect.value;

    if (isNaN(T) || isNaN(P)) {
      alert("Please enter valid Temperature and Pressure values.");
      return;
    }

    const results = computeProperties(T, P, phase);

    displayResults(results);
  });

  function displayResults(results) {
    inputs.density.value = format(results.density);
    inputs.specificVolume.value = format(results.specificVolume);
    inputs.enthalpy.value = format(results.enthalpy);
    inputs.entropy.value = format(results.entropy);
    inputs.cp.value = format(results.cp);
    inputs.cv.value = format(results.cv);
    inputs.viscosity.value = format(results.viscosity);
    inputs.thermalConductivity.value = format(results.thermalConductivity);
  }

  function format(value) {
    if (value === undefined || value === null || isNaN(value)) return "—";
    return value.toFixed(4);
  }
});
