// re.js

import { normalize } from "./unitsData.js";
import { PIPE_ROUGHNESS } from "../pump-power-calculator/js/data/pipeRoughness.js";
import { frictionFactor } from "../pump-power-calculator/js/frictionPipe.js";

const calculateBtn = document.getElementById("calculateBtn");
const materialSelect = document.getElementById("materialSelect");

// ----------------------
// Populate Material List
// ----------------------

Object.keys(PIPE_ROUGHNESS).forEach(material => {
  const option = document.createElement("option");
  option.value = material;
  option.textContent = material;
  materialSelect.appendChild(option);
});

// Auto-fill roughness
materialSelect.addEventListener("change", () => {
  const selected = materialSelect.value;
  if (selected && PIPE_ROUGHNESS[selected]) {
    document.getElementById("roughnessInput").value =
      PIPE_ROUGHNESS[selected];
    document.getElementById("roughnessUnit").value = "m";
  }
});

// ----------------------
// Calculation
// ----------------------

calculateBtn.addEventListener("click", () => {

  const method = document.getElementById("method").value;

  const rho = normalize("density",
    parseFloat(document.getElementById("density").value),
    "kgm3");

  const V = normalize("velocity",
    parseFloat(document.getElementById("velocity").value),
    "ms");

  const D = normalize("length",
    parseFloat(document.getElementById("diameter").value),
    "m");

  const e = normalize("length",
    parseFloat(document.getElementById("roughnessInput").value),
    document.getElementById("roughnessUnit").value);

  let Re;

  if (method === "dynamic") {
    const mu = normalize("dynamicViscosity",
      parseFloat(document.getElementById("mu").value),
      "Pas");

    Re = (rho * V * D) / mu;
  } else {
    const nu = normalize("kinematicViscosity",
      parseFloat(document.getElementById("nu").value),
      "m2s");

    Re = (V * D) / nu;
  }

  // ----------------------
  // Friction Factor
  // ----------------------

  const f = frictionFactor(Re, e, D);

  // ----------------------
  // Regime
  // ----------------------

  let regime;
  if (Re < 2300) regime = "Laminar";
  else if (Re <= 4000) regime = "Transitional";
  else regime = "Turbulent";

  // ----------------------
  // Display Results
  // ----------------------

  document.getElementById("reValue").innerText = Re.toFixed(2);
  document.getElementById("regimeDisplay").innerText =
    `${regime} Flow`;

  document.getElementById("frictionDisplay").innerText =
    `f = ${f.toFixed(6)}`;

  document.getElementById("formulaDisplay").innerText =
`Re = (ρVD)/μ  or  (VD)/ν

Darcy–Weisbach:
ΔP = f (L/D) (ρV²/2)`;

  document.getElementById("dimensionDisplay").innerText =
`Re → Dimensionless
f  → Dimensionless`;

  document.getElementById("stepsDisplay").innerText =
`1) Normalize Inputs:
   D = ${D.toExponential(4)} m
   ε = ${e.toExponential(4)} m

2) Compute Reynolds Number:
   Re = ${Re.toFixed(2)}

3) Relative Roughness:
   ε/D = ${(e/D).toExponential(4)}

4) Compute Friction Factor (Churchill equation approximation):
   f = ${f.toFixed(6)}`;

  document.getElementById("notesDisplay").innerText =
`Laminar: f = 16/Re
Turbulent: Churchill explicit approximation
Transitional: Blended solution

Relative roughness (ε/D) determines
whether pipe behaves hydraulically smooth
or fully rough at high Reynolds number.`;

});
