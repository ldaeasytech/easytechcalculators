// re.js
// Reynolds Number + Darcy Friction Factor Calculator

import { normalize } from "./unitsData.js";
import { PIPE_ROUGHNESS } from "../pump-power-calculator/js/data/pipeRoughness.js";
import { frictionFactor } from "../pump-power-calculator/js/frictionPipe.js";

const calculateBtn = document.getElementById("calculateBtn");
const methodSelect = document.getElementById("method");

const dynamicGroup = document.getElementById("dynamicGroup");
const kinematicGroup = document.getElementById("kinematicGroup");

const materialSelect = document.getElementById("materialSelect");

// --------------------------------------------------
// Populate Material Dropdown
// --------------------------------------------------

Object.keys(PIPE_ROUGHNESS).forEach(material => {
  const option = document.createElement("option");
  option.value = material;
  option.textContent = material;
  materialSelect.appendChild(option);
});

// Auto-fill roughness when material selected
materialSelect.addEventListener("change", () => {
  const selected = materialSelect.value;
  if (selected && PIPE_ROUGHNESS[selected]) {
    document.getElementById("roughnessInput").value =
      PIPE_ROUGHNESS[selected];
    document.getElementById("roughnessUnit").value = "m";
  }
});

// --------------------------------------------------
// Toggle Viscosity Inputs
// --------------------------------------------------

methodSelect.addEventListener("change", () => {
  if (methodSelect.value === "dynamic") {
    dynamicGroup.style.display = "block";
    kinematicGroup.style.display = "none";
  } else {
    dynamicGroup.style.display = "none";
    kinematicGroup.style.display = "block";
  }
});

// --------------------------------------------------
// Main Calculation
// --------------------------------------------------

calculateBtn.addEventListener("click", () => {

  try {

    // ----------------------------
    // Normalize Inputs to SI Units
    // ----------------------------

    const rho = normalize(
      "density",
      parseFloat(document.getElementById("density").value),
      document.getElementById("densityUnit").value
    );

    const V = normalize(
      "velocity",
      parseFloat(document.getElementById("velocity").value),
      document.getElementById("velocityUnit").value
    );

    const D = normalize(
      "length",
      parseFloat(document.getElementById("diameter").value),
      document.getElementById("diameterUnit").value
    );

    const e = normalize(
      "length",
      parseFloat(document.getElementById("roughnessInput").value),
      document.getElementById("roughnessUnit").value
    );

    if (!V || !D) {
      alert("Velocity and Diameter are required.");
      return;
    }

    let Re;
    let viscosityText = "";

    // ----------------------------
    // Reynolds Number
    // ----------------------------

    if (methodSelect.value === "dynamic") {

      const mu = normalize(
        "dynamicViscosity",
        parseFloat(document.getElementById("mu").value),
        document.getElementById("muUnit").value
      );

      if (!rho || !mu) {
        alert("Density and Dynamic Viscosity are required.");
        return;
      }

      Re = (rho * V * D) / mu;

      viscosityText = `μ = ${mu.toExponential(4)} Pa·s`;

    } else {

      const nu = normalize(
        "kinematicViscosity",
        parseFloat(document.getElementById("nu").value),
        document.getElementById("nuUnit").value
      );

      if (!nu) {
        alert("Kinematic Viscosity is required.");
        return;
      }

      Re = (V * D) / nu;

      viscosityText = `ν = ${nu.toExponential(4)} m²/s`;
    }

    // ----------------------------
    // Flow Regime
    // ----------------------------

    let regimeText;

    if (Re < 2300) {
      regimeText = "Laminar Flow (Re < 2300)";
    } else if (Re <= 4000) {
      regimeText = "Transitional Flow (2300 – 4000)";
    } else {
      regimeText = "Turbulent Flow (Re > 4000)";
    }

    // ----------------------------
    // Darcy Friction Factor
    // ----------------------------

    const f = frictionFactor(Re, e, D);

    // ----------------------------
    // Display Results
    // ----------------------------

    document.getElementById("reValue").innerText = Re.toFixed(2);
    document.getElementById("regimeDisplay").innerText = regimeText;
    document.getElementById("frictionDisplay").innerText =
      `f = ${f.toFixed(6)}`;

    document.getElementById("formulaDisplay").innerText =
`Re = (ρ V D) / μ   or   Re = (V D) / ν

Darcy–Weisbach:
ΔP = f (L/D) (ρV²/2)`;

    document.getElementById("dimensionDisplay").innerText =
`Re → Dimensionless
f  → Dimensionless`;

    document.getElementById("stepsDisplay").innerText =
`1) Input Values:
   ρ = ${document.getElementById("density").value} ${document.getElementById("densityUnit").selectedOptions[0].text}
   V = ${document.getElementById("velocity").value} ${document.getElementById("velocityUnit").selectedOptions[0].text}
   D = ${document.getElementById("diameter").value} ${document.getElementById("diameterUnit").selectedOptions[0].text}
   ε = ${document.getElementById("roughnessInput").value} ${document.getElementById("roughnessUnit").selectedOptions[0].text}

2) Normalized to SI:
   ρ = ${rho.toExponential(4)} kg/m³
   V = ${V.toExponential(4)} m/s
   D = ${D.toExponential(4)} m
   ε = ${e.toExponential(4)} m
   ${viscosityText}

3) Reynolds Number:
   Re = ${Re.toFixed(2)}

4) Relative Roughness:
   ε/D = ${(e / D).toExponential(4)}

5) Darcy Friction Factor:
   f = ${f.toFixed(6)}`;

    document.getElementById("notesDisplay").innerText =
`Laminar region:
  f = 64 / Re  (Darcy formulation)

Turbulent region:
  Explicit Colebrook–White (Churchill correlation)

Relative roughness (ε/D) governs
hydraulically smooth vs fully rough behavior.`;

  } catch (err) {
    console.error(err);
    alert("Please ensure all required fields are entered correctly.");
  }

});
