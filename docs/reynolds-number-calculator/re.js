// re.js
import { normalize } from "./unitsData.js";

const method = document.getElementById("method");
const dynamicGroup = document.getElementById("dynamicGroup");
const kinematicGroup = document.getElementById("kinematicGroup");

method.addEventListener("change", () => {
  dynamicGroup.style.display = method.value === "dynamic" ? "block" : "none";
  kinematicGroup.style.display = method.value === "kinematic" ? "block" : "none";
});

document.getElementById("calculateBtn").addEventListener("click", () => {

  const rho = normalize("density",
    parseFloat(document.getElementById("density").value),
    document.getElementById("densityUnit").value);

  const V = normalize("velocity",
    parseFloat(document.getElementById("velocity").value),
    document.getElementById("velocityUnit").value);

  const D = normalize("length",
    parseFloat(document.getElementById("diameter").value),
    document.getElementById("diameterUnit").value);

  let Re;

  if (method.value === "dynamic") {
    const mu = normalize("dynamicViscosity",
      parseFloat(document.getElementById("mu").value),
      document.getElementById("muUnit").value);

    Re = (rho * V * D) / mu;

  } else {
    const nu = normalize("kinematicViscosity",
      parseFloat(document.getElementById("nu").value),
      document.getElementById("nuUnit").value);

    Re = (V * D) / nu;
  }

  const regime = classifyFlow(Re);

  document.getElementById("reOutput").innerHTML = `Re = ${Re.toFixed(2)}`;
  document.getElementById("regimeOutput").innerHTML = regime;

  document.getElementById("stepsOutput").innerHTML = `
    <h3>Governing Equation</h3>
    <p>Re = (ρ V D) / μ  OR  Re = (V D) / ν</p>

    <h3>Dimensional Verification</h3>
    <p>Units cancel → Dimensionless</p>

    <h3>Engineering Interpretation</h3>
    <p>${regime}</p>
  `;
});

function classifyFlow(Re) {
  if (Re < 2300) return "Laminar Flow (Re < 2300)";
  if (Re <= 4000) return "Transitional Flow (2300–4000)";
  return "Turbulent Flow (Re > 4000)";
}
