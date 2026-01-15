/***************************************
 * CONFIG
 ***************************************/
const API_BASE = "https://api.easytechcalculators.com";

/***************************************
 * PROPERTY METADATA (DISPLAY CONTROL)
 ***************************************/
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

/***************************************
 * BUILD REQUEST PAYLOAD
 ***************************************/
function buildPayload() {
  return {
    T: getNumber("inputT"),
    P: getNumber("inputP"),
    h: getNumber("inputH"),
    s: getNumber("inputS"),
    rho: getNumber("inputRho"),
    quality: getNumber("inputX"),
    phase: getSelect("inputPhase")
  };
}

function getNumber(id) {
  const el = document.getElementById(id);
  if (!el || el.value === "") return null;
  return Number(el.value);
}

function getSelect(id) {
  const el = document.getElementById(id);
  if (!el || el.value === "") return null;
  return el.value;
}

/***************************************
 * MAIN SOLVE FUNCTION
 ***************************************/
async function solve() {
  clearResults();

  const payload = buildPayload();

  try {
    const res = await fetch(`${API_BASE}/water/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);

  } catch (err) {
    console.error("Calculation failed:", err);
    showError("Calculation failed. Please check inputs.");
  }
}

/***************************************
 * RENDER RESULTS TABLE
 ***************************************/
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

/***************************************
 * UTILITIES
 ***************************************/
function formatNumber(x) {
  if (!isFinite(x)) return "—";
  return x.toPrecision(6);
}

function clearResults() {
  const tbody = document.getElementById("results-body");
  if (tbody) tbody.innerHTML = "";
}

function showError(msg) {
  alert(msg);
}

/***************************************
 * BUTTON BINDING
 ***************************************/
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("calculateBtn");
  if (btn) {
    btn.addEventListener("click", solve);
  }
});
