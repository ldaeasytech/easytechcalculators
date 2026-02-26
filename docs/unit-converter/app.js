import { units } from "./unitsData.js";
import { formulas } from "./formulas.js";
import { convert } from "./converterEngine.js";
import { formatDimension } from "./dimensionEngine.js";
import { quantityLabels } from "./unitsData.js";

const quantitySelect = document.getElementById("quantity");
const fromSelect = document.getElementById("fromUnit");
const toSelect = document.getElementById("toUnit");
const inputValue = document.getElementById("inputValue");

const resultValue = document.getElementById("resultValue");
const resultUnit = document.getElementById("resultUnit");

const formulaTitle = document.getElementById("formulaTitle");
const formulaDisplay = document.getElementById("formulaDisplay");
const dimensionDisplay = document.getElementById("dimensionDisplay");
const stepsDisplay = document.getElementById("stepsDisplay");
const notesDisplay = document.getElementById("notesDisplay");

/* ===============================
   Populate Quantity Dropdown
================================ */

function populateQuantities() {
  quantitySelect.innerHTML = "";

  Object.keys(units).forEach(q => {
    const opt = document.createElement("option");
    opt.value = q;
    opt.textContent = quantityLabels[q] || q;
    quantitySelect.appendChild(opt);
  });
}

/* ===============================
   Populate Units
================================ */

function populateUnits(quantity) {
  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  Object.keys(units[quantity].units).forEach(u => {
    fromSelect.add(new Option(u, u));
    toSelect.add(new Option(u, u));
  });
}

quantitySelect.addEventListener("change", e => {
  populateUnits(e.target.value);
});

/* ===============================
   Conversion Logic
================================ */

document.getElementById("convertBtn").addEventListener("click", () => {

  const quantity = quantitySelect.value;
  const value = parseFloat(inputValue.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(value)) return;

  try {

    const data = convert(quantity, value, from, to);

    /* ===============================
       Result
    ================================ */

    resultValue.textContent = data.result.toPrecision(8);
    resultUnit.textContent = to;

    /* ===============================
       Formula + Notes
    ================================ */

    if (formulas[quantity]) {
      formulaTitle.textContent = formulas[quantity].title || "Governing Engineering Relation";
      formulaDisplay.textContent = formulas[quantity].formula;
      notesDisplay.innerHTML = formulas[quantity].note;
    } else {
      formulaTitle.textContent = "";
      formulaDisplay.textContent = "";
      notesDisplay.textContent = "";
    }

    /* ===============================
       Dimensional Display
    ================================ */

    if (data.from?.dim) {
      dimensionDisplay.textContent =
        "[" + formatDimension(data.from.dim) + "]";
    } else {
      dimensionDisplay.textContent = "";
    }

    /* ===============================
       Engineering Conversion Steps
    ================================ */

    if (quantity === "temperature") {

      stepsDisplay.textContent = `
Temperature conversion uses offset normalization through Kelvin.

Example:
°C → K → °F
`;

    } else {

const baseFactor = data.from.factor;
const targetFactor = data.to.factor;

// Build symbolic fraction
let fraction;

// If converting from base → target
if (baseFactor === 1) {
  fraction = `1 ${to} / ${targetFactor} ${from}`;
} else {
  fraction = `${targetFactor} ${to} / ${baseFactor} ${from}`;
}

// Better universal expression:
const expression = `
${value} ${from} × (${baseFactor} ${units[quantity].base} / 1 ${from})
× (1 ${to} / ${targetFactor} ${units[quantity].base})
`;

stepsDisplay.innerHTML = `
<strong>Unit Conversion</strong>

${value} ${from}
× (${baseFactor} ${units[quantity].base} / 1 ${from})
× (1 ${to} / ${targetFactor} ${units[quantity].base})
= <strong>${data.result.toPrecision(8)} ${to}</strong>
`;
    }

  } catch (err) {
    stepsDisplay.textContent = "Error: " + err.message;
  }

});

/* ===============================
   Initialize
================================ */

populateQuantities();
populateUnits(Object.keys(units)[0]);
