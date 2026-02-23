// re.js
// Reynolds + Darcy Friction Factor + Pressure Drop

import { normalize } from "./unitsData.js";
import { PIPE_ROUGHNESS } from "../pump-power-calculator/js/data/pipeRoughness.js";
import { frictionFactor } from "./frictionPipe.js";
import { renderMoody } from "./moody.js";

const calculateBtn = document.getElementById("calculateBtn");
const methodSelect = document.getElementById("method");

const dynamicGroup = document.getElementById("dynamicGroup");
const kinematicGroup = document.getElementById("kinematicGroup");
const materialSelect = document.getElementById("materialSelect");

// ----------------------------
// Populate Materials
// ----------------------------

Object.keys(PIPE_ROUGHNESS).forEach(material => {
  const option = document.createElement("option");
  option.value = material;
  option.textContent = material;
  materialSelect.appendChild(option);
});

materialSelect.addEventListener("change", () => {
  const selected = materialSelect.value;
  if (selected && PIPE_ROUGHNESS[selected]) {
    document.getElementById("roughnessInput").value =
      PIPE_ROUGHNESS[selected];
    document.getElementById("roughnessUnit").value = "m";
  }
});

// ----------------------------
// Toggle viscosity inputs
// ----------------------------

methodSelect.addEventListener("change", () => {
  if (methodSelect.value === "dynamic") {
    dynamicGroup.style.display = "block";
    kinematicGroup.style.display = "none";
  } else {
    dynamicGroup.style.display = "none";
    kinematicGroup.style.display = "block";
  }
});

// ----------------------------
// Main Calculation
// ----------------------------

calculateBtn.addEventListener("click", () => {

  // Normalize base inputs
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

  const L = normalize(
    "length",
    parseFloat(document.getElementById("length").value),
    document.getElementById("lengthUnit").value
  );

  const e = normalize(
    "length",
    parseFloat(document.getElementById("roughnessInput").value),
    document.getElementById("roughnessUnit").value
  );

  let Re;

  if (methodSelect.value === "dynamic") {

    const mu = normalize(
      "dynamicViscosity",
      parseFloat(document.getElementById("mu").value),
      document.getElementById("muUnit").value
    );

    Re = (rho * V * D) / mu;

  } else {

    const nu = normalize(
      "kinematicViscosity",
      parseFloat(document.getElementById("nu").value),
      document.getElementById("nuUnit").value
    );

    Re = (V * D) / nu;
  }

  // Flow regime
  let regime;
  if (Re < 2300) regime = "(Laminar)";
  else if (Re <= 4000) regime = "(Transitional)";
  else regime = "(Turbulent)";

  // Darcy friction factor
  const fFanning = frictionFactor(Re, e, D);
  const fDarcy = 4*fFanning; 
  
  // Darcy–Weisbach Pressure Drop
  // ΔP = f (L/D) (ρV²/2)

  const deltaP = fDarcy * (L / D) * (rho * V * V / 2);

  renderMoody(Re, fDarcy);

  
  // Convert to user-friendly output (Pa, kPa, MPa, psi)

  let pressureValue = deltaP;
  let pressureUnit = "Pa";

  if (deltaP > 1e6) {
    pressureValue = deltaP / 1e6;
    pressureUnit = "MPa";
  } else if (deltaP > 1e3) {
    pressureValue = deltaP / 1e3;
    pressureUnit = "kPa";
  }

  // Display results
  document.getElementById("pressureValue").innerText =
    pressureValue.toFixed(4);

  document.getElementById("pressureUnit").innerText =
    pressureUnit;

  document.getElementById("darcyValue").innerText =
  fDarcy.toFixed(6);

  document.getElementById("fanningValue").innerText =
  fFanning.toFixed(6);

  document.getElementById("reValue").innerText =
    Re.toFixed(2);

  document.getElementById("regimeText").innerText =
    regime;

});
