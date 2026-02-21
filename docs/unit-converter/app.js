import { units } from "./unitsData.js";
import { formulas } from "./formulas.js";
import { convert } from "./converterEngine.js";

const quantitySelect = document.getElementById("quantity");
const fromSelect = document.getElementById("fromUnit");
const toSelect = document.getElementById("toUnit");
const inputValue = document.getElementById("inputValue");

const resultValue = document.getElementById("resultValue");
const resultUnit = document.getElementById("resultUnit");
const formulaDisplay = document.getElementById("formulaDisplay");
const stepsDisplay = document.getElementById("stepsDisplay");
const notesDisplay = document.getElementById("notesDisplay");

function populateQuantities() {
  Object.keys(units).forEach(q => {
    const opt = document.createElement("option");
    opt.value = q;
    opt.textContent = q;
    quantitySelect.appendChild(opt);
  });
}

function populateUnits(quantity) {
  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  Object.keys(units[quantity].units).forEach(u => {
    const opt1 = new Option(u, u);
    const opt2 = new Option(u, u);
    fromSelect.add(opt1);
    toSelect.add(opt2);
  });
}

quantitySelect.addEventListener("change", e => {
  populateUnits(e.target.value);
});

document.getElementById("convertBtn").addEventListener("click", () => {

  const quantity = quantitySelect.value;
  const value = parseFloat(inputValue.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!value && value !== 0) return;

  const data = convert(quantity, value, from, to);

  resultValue.textContent = data.result.toPrecision(8);
  resultUnit.textContent = to;

  if (formulas[quantity]) {
    formulaDisplay.textContent = formulas[quantity].formula;
    notesDisplay.textContent = formulas[quantity].note;
  }

  if (data.baseUnit) {
    stepsDisplay.textContent =
      `Step 1: Convert to base (${data.baseUnit})
Base = ${value} × ${data.fromFactor}

Step 2: Convert to ${to}
Result = Base ÷ ${data.toFactor}`;
  } else {
    stepsDisplay.textContent = "Direct temperature conversion applied.";
  }

});

populateQuantities();
populateUnits("mass");
