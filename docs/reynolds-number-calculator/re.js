// re.js
import { normalize } from "./unitsData.js";

const methodSelect = document.getElementById("method");
const calculateBtn = document.getElementById("calculateBtn");

calculateBtn.addEventListener("click", () => {

  const method = methodSelect.value;

  const rhoInput = parseFloat(document.getElementById("density").value);
  const VInput   = parseFloat(document.getElementById("velocity").value);
  const DInput   = parseFloat(document.getElementById("diameter").value);

  if (!VInput || !DInput) {
    alert("Please enter velocity and diameter.");
    return;
  }

  // --- Normalize Inputs to Base SI Units ---
  const rho = rhoInput ? normalize("density", rhoInput, "kgm3") : null;
  const V   = normalize("velocity", VInput, "ms");
  const D   = normalize("length", DInput, "m");

  let Re;
  let formulaDisplay;
  let dimensionDisplay;
  let stepsDisplay;
  let notesDisplay;

  if (method === "dynamic") {

    const muInput = parseFloat(document.getElementById("mu")?.value);

    if (!rhoInput || !muInput) {
      alert("Density and dynamic viscosity are required.");
      return;
    }

    const mu = normalize("dynamicViscosity", muInput, "Pas");

    Re = (rho * V * D) / mu;

    formulaDisplay = `
Re = (ρ V D) / μ
    `;

    dimensionDisplay = `
ρ  → [M L⁻³]
V  → [L T⁻¹]
D  → [L]
μ  → [M L⁻¹ T⁻¹]

Re = [M L⁻³][L T⁻¹][L] / [M L⁻¹ T⁻¹]

= [M L⁻¹ T⁻¹] / [M L⁻¹ T⁻¹]

= Dimensionless
    `;

    stepsDisplay = `
1) Normalize to SI base units:
   ρ = ${rho.toExponential(4)} kg/m³
   V = ${V.toExponential(4)} m/s
   D = ${D.toExponential(4)} m
   μ = ${mu.toExponential(4)} Pa·s

2) Substitute into equation:

   Re = (ρ V D) / μ

   Re = (${rho.toExponential(4)} × ${V.toExponential(4)} × ${D.toExponential(4)}) / ${mu.toExponential(4)}

3) Result:

   Re = ${Re.toFixed(2)}
    `;

    notesDisplay = `
Dynamic viscosity form is commonly used when fluid shear resistance (μ) is known.
This form highlights the ratio of inertial forces (ρVD) to viscous forces (μ).
    `;

  } else {

    const nuInput = parseFloat(document.getElementById("nu")?.value);

    if (!nuInput) {
      alert("Kinematic viscosity is required.");
      return;
    }

    const nu = normalize("kinematicViscosity", nuInput, "m2s");

    Re = (V * D) / nu;

    formulaDisplay = `
Re = (V D) / ν
    `;

    dimensionDisplay = `
V  → [L T⁻¹]
D  → [L]
ν  → [L² T⁻¹]

Re = [L T⁻¹][L] / [L² T⁻¹]

= Dimensionless
    `;

    stepsDisplay = `
1) Normalize to SI base units:
   V = ${V.toExponential(4)} m/s
   D = ${D.toExponential(4)} m
   ν = ${nu.toExponential(4)} m²/s

2) Substitute into equation:

   Re = (V D) / ν

   Re = (${V.toExponential(4)} × ${D.toExponential(4)}) / ${nu.toExponential(4)}

3) Result:

   Re = ${Re.toFixed(2)}
    `;

    notesDisplay = `
Kinematic viscosity form is commonly used in experimental fluid mechanics
and when ν is provided directly (e.g., from fluid property tables).
    `;
  }

  // --- Flow Regime Classification ---
  let regime;
  if (Re < 2300) {
    regime = "Laminar Flow (Re < 2300) — Viscous forces dominate. Smooth, orderly motion.";
  } else if (Re <= 4000) {
    regime = "Transitional Flow (2300–4000) — Instability region between laminar and turbulent.";
  } else {
    regime = "Turbulent Flow (Re > 4000) — Inertial forces dominate. Chaotic mixing occurs.";
  }

  // --- Display Results ---
  document.getElementById("reValue").innerText = Re.toFixed(2);
  document.getElementById("regimeDisplay").innerText = regime;
  document.getElementById("formulaDisplay").innerText = formulaDisplay;
  document.getElementById("dimensionDisplay").innerText = dimensionDisplay;
  document.getElementById("stepsDisplay").innerText = stepsDisplay;
  document.getElementById("notesDisplay").innerText = notesDisplay;

});
