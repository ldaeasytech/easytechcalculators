const API = "https://api.easytechcalculators.com/water/state";

/* ================================
   UNIT HANDLING
================================ */

const unitSystem = () => document.getElementById("unitSystem").value;

function toSI(name, value) {
  if (unitSystem() === "SI") return value;

  switch (name) {
    case "T": return (value - 32) * 5/9 + 273.15;
    case "P": return value * 6894.76;
    case "H": return value * 2326;
    case "S": return value * 4186;
    case "D": return value * 16.0185;
    default: return value;
  }
}

function fromSI(name, value) {
  if (unitSystem() === "SI") return value;

  switch (name) {
    case "T": return (value - 273.15) * 9/5 + 32;
    case "P": return value / 6894.76;
    case "H": return value / 2326;
    case "S": return value / 4186;
    case "D": return value / 16.0185;
    default: return value;
  }
}

/* ================================
   INPUT PAIRS
================================ */

const PAIRS = {
  PT: [["T", "Temperature"], ["P", "Pressure"]],
  Px: [["P", "Pressure"], ["X", "Quality (0–1)"]],
  Tx: [["T", "Temperature"], ["X", "Quality (0–1)"]],
  Ph: [["P", "Pressure"], ["H", "Enthalpy"]],
  Ps: [["P", "Pressure"], ["S", "Entropy"]],
  hs: [["H", "Enthalpy"], ["S", "Entropy"]],
  rhoT: [["D", "Density"], ["T", "Temperature"]]
};

function unitLabel(name) {
  if (unitSystem() === "SI") {
    return {
      T: "K", P: "Pa", H: "J/kg", S: "J/kg·K", D: "kg/m³"
    }[name] || "";
  }
  return {
    T: "°F", P: "psia", H: "Btu/lbm", S: "Btu/lbm·R", D: "lbm/ft³"
  }[name] || "";
}

function updateInputs() {
  const pair = document.getElementById("pair").value;
  const container = document.getElementById("inputs");
  container.innerHTML = "";

  PAIRS[pair].forEach((p, i) => {
    container.innerHTML += `
      <label>${p[1]} (${unitLabel(p[0])})</label>
      <input id="v${i}" type="number" step="any">
      <input id="n${i}" type="hidden" value="${p[0]}">
    `;
  });
}

updateInputs();

/* ================================
   FORMAT HELPERS
================================ */

function fmt(val, digits = 4) {
  return typeof val === "number" && isFinite(val) ? val.toFixed(digits) : "N/A";
}

function fmtExp(val, digits = 4) {
  return typeof val === "number" && isFinite(val) ? val.toExponential(digits) : "N/A";
}

/* ================================
   SOLVER
================================ */

async function solve() {
  const body = {
    input1_name: document.getElementById("n0").value,
    input1_value: toSI(
      document.getElementById("n0").value,
      parseFloat(document.getElementById("v0").value)
    ),
    input2_name: document.getElementById("n1").value,
    input2_value: toSI(
      document.getElementById("n1").value,
      parseFloat(document.getElementById("v1").value)
    )
  };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const d = await res.json();

    if (!res.ok) {
      throw new Error(d.detail || d.error || "Calculation failed.");
    }

    document.getElementById("output").innerHTML = `
      <h2>Results</h2>
      <p><b>Phase:</b> ${d.phase}</p>
      ${d.quality !== null && d.quality !== undefined ? `<p><b>Quality:</b> ${fmt(d.quality, 4)}</p>` : ""}
      <table>
        <tr><td>Temperature</td><td>${fmt(fromSI("T", d.T), 2)} ${unitLabel("T")}</td></tr>
        <tr><td>Pressure</td><td>${fmt(fromSI("P", d.P), 4)} ${unitLabel("P")}</td></tr>
        <tr><td>Density</td><td>${fmt(fromSI("D", d.density), 4)} ${unitLabel("D")}</td></tr>
        <tr><td>Specific Volume</td><td>${fmtExp(1 / d.density, 4)} m³/kg</td></tr>
        <tr><td>cp</td><td>${fmt(d.cp, 2)} J/kg·K</td></tr>
        <tr><td>cv</td><td>${fmt(d.cv, 2)} J/kg·K</td></tr>
        <tr><td>Entropy</td><td>${fmt(fromSI("S", d.entropy), 3)} ${unitLabel("S")}</td></tr>
        <tr><td>Enthalpy</td><td>${fmt(fromSI("H", d.enthalpy), 2)} ${unitLabel("H")}</td></tr>
        <tr><td>Conductivity</td><td>${fmt(d.conductivity, 4)} W/m·K</td></tr>
        ${d.viscosity !== null && d.viscosity !== undefined
          ? `<tr><td>Viscosity</td><td>${fmtExp(d.viscosity, 4)} Pa·s</td></tr>`
          : ""}
      </table>
    `;

    plotCharts(d);

  } catch (err) {
    document.getElementById("output").innerHTML = `
      <div class="error-box">
        ⚠️ ${err.message}
      </div>
    `;
  }
}

/* ================================
   CHARTS
================================ */

let chartTS = null;
let chartHS = null;

function plotCharts(d) {
  const T = fromSI("T", d.T);
  const s = fromSI("S", d.entropy);
  const h = fromSI("H", d.enthalpy);

  if (chartTS) chartTS.destroy();
  if (chartHS) chartHS.destroy();

  chartTS = new Chart(document.getElementById("chartTS"), {
    type: "scatter",
    data: { datasets: [{ data: [{ x: s, y: T }] }] },
    options: {
      plugins: { legend: { display: false }},
      scales: {
        x: { title: { display: true, text: "Entropy" }},
        y: { title: { display: true, text: "Temperature" }}
      }
    }
  });

  chartHS = new Chart(document.getElementById("chartHS"), {
    type: "scatter",
    data: { datasets: [{ data: [{ x: s, y: h }] }] },
    options: {
      plugins: { legend: { display: false }},
      scales: {
        x: { title: { display: true, text: "Entropy" }},
        y: { title: { display: true, text: "Enthalpy" }}
      }
    }
  });
}
