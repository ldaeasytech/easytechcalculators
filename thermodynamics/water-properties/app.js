/*************************************************
 * CONFIG
 *************************************************/
const API_BASE = "https://api.easytechcalculators.com";

/*************************************************
 * INPUT PAIR DEFINITIONS
 *************************************************/
const INPUT_PAIRS = {
  TP: [
    { id: "inputT", label: "Temperature", unit: "K" },
    { id: "inputP", label: "Pressure", unit: "Pa" }
  ],
  Px: [
    { id: "inputP", label: "Pressure", unit: "Pa" },
    { id: "inputX", label: "Quality (x)", unit: "-" }
  ],
  Tx: [
    { id: "inputT", label: "Temperature", unit: "K" },
    { id: "inputX", label: "Quality (x)", unit: "-" }
  ],
  Ph: [
    { id: "inputP", label: "Pressure", unit: "Pa" },
    { id: "inputH", label: "Enthalpy", unit: "J/kg" }
  ],
  Ps: [
    { id: "inputP", label: "Pressure", unit: "Pa" },
    { id: "inputS", label: "Entropy", unit: "J/kg·K" }
  ],
  hs: [
    { id: "inputH", label: "Enthalpy", unit: "J/kg" },
    { id: "inputS", label: "Entropy", unit: "J/kg·K" }
  ],
  rhoT: [
    { id: "inputRho", label: "Density", unit: "kg/m³" },
    { id: "inputT", label: "Temperature", unit: "K" }
  ]
};

/*************************************************
 * RESULT PROPERTY MAP
 *************************************************/
const PROPERTY_MAP = [
  { key: "T", label: "Temperature", unit: "K" },
  { key: "P", label: "Pressure", unit: "Pa" },
  { key: "phase", label: "Phase", unit: "" },
  { key: "quality", label: "Quality (x)", unit: "-" },
  { key: "density", label: "Density", unit: "kg/m³" },
  { key: "cp", label: "Cp", unit: "J/kg·K" },
  { key: "cv", label: "Cv", unit: "J/kg·K" },
  { key: "entropy", label: "Entropy", unit: "J/kg·K" },
  { key: "enthalpy", label: "Enthalpy", unit: "J/kg" },
  { key: "conductivity", label: "Thermal Conductivity", unit: "W/m·K" },
  { key: "viscosity", label: "Viscosity", unit: "Pa·s" }
];

/*************************************************
 * RENDER INPUTS BASED ON INPUT PAIR
 *************************************************/
function renderInputs(pairKey) {
  const container = document.getElementById("dynamic-inputs");
  container.innerHTML = "";

  INPUT_PAIRS[pairKey].forEach(input => {
    const div = document.createElement("div");
    div.className = "input-row";

    div.innerHTML = `
      <label>
        ${input.label} (${input.unit})
        <input id="${input.id}" type="number" step="any">
      </label>
    `;

    container.appendChild(div);
  });
}

/*************************************************
 * BUILD API PAYLOAD FROM VISIBLE INPUTS
 *************************************************/
function buildPayload() {
  const payload = {};

  [
    "inputT",
    "inputP",
    "inputH",
    "inputS",
    "inputRho",
    "inputX"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value !== "") {
      const key = id.replace("input", "").toLowerCase();
      payload[key === "rho" ? "density" : key] = Number(el.value);
    }
  });

  return payload;
}

/*************************************************
 * MAIN SOLVER
 *************************************************/
async function solve() {
  clearResults();

  const payload = buildPayload();

  try {
    const res = await fetch(`${API_BASE}/water/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);

  } catch (err) {
    console.error(err);
    alert("Calculation failed. Please check inputs.");
  }
}

/*************************************************
 * RENDER RESULTS TABLE
 *************************************************/
function renderResults(data) {
  const tbody = document.getElementById("results-body");
  tbody.innerHTML = "";

  PROPERTY_MAP.forEach(prop => {
    let value = data[prop.key];

    if (value === null || value === undefined) {
      value = "—";
    } else if (typeof value === "number") {
      value = formatNumber(value);
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${prop.label}</td>
      <td>${value}</td>
      <td>${prop.unit}</td>
    `;
    tbody.appendChild(row);
  });
}

/*************************************************
 * UTILITIES
 *************************************************/
function formatNumber(x) {
  if (!isFinite(x)) return "—";
  return x.toPrecision(6);
}

function clearResults() {
  const tbody = document.getElementById("results-body");
  if (tbody) tbody.innerHTML = "";
}

/*************************************************
 * INITIALIZATION
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const pairSelect = document.getElementById("inputPair");
  const calcBtn = document.getElementById("calculateBtn");

  renderInputs(pairSelect.value);

  pairSelect.addEventListener("change", () => {
    renderInputs(pairSelect.value);
  });

  calcBtn.addEventListener("click", solve);
});
