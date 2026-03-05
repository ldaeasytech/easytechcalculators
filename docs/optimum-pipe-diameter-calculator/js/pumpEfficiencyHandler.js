import { PUMP_TYPES } from "./data/pumpEfficiencyData.js";

const pumpTypeSelect =
  document.getElementById("pumpType");

const efficiencyRangeDisplay =
  document.getElementById("efficiencyRange");

const efficiencyInput =
  document.getElementById("pumpEfficiency");

// Populate dropdown
Object.keys(PUMP_TYPES).forEach(type => {
  const opt = document.createElement("option");
  opt.value = type;
  opt.textContent = type;
  pumpTypeSelect.appendChild(opt);
});

function updateEfficiencyRange() {

  const selected = pumpTypeSelect.value;
  const range = PUMP_TYPES[selected];

  efficiencyRangeDisplay.textContent =
    `${(range.min * 100).toFixed(0)}% – ${(range.max * 100).toFixed(0)}%`;

  // Optional: auto-fill mid value if empty
  if (!efficiencyInput.value) {
    const mid = (range.min + range.max) / 2;
    efficiencyInput.value = (mid * 100).toFixed(1);
  }
}

pumpTypeSelect.addEventListener("change", updateEfficiencyRange);

updateEfficiencyRange();

// Export efficiency getter
export function getEfficiencyDecimal() {

  const etaPercent =
    Number(efficiencyInput.value);

  if (!etaPercent || etaPercent <= 0)
    return null;

  return etaPercent / 100;
}
