const API = "https://easytechcalculators-api.onrender.com/";

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

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const d = await res.json();

  document.getElementById("output").innerHTML = `
    <h2>Results</h2>
    <p><b>Phase:</b> ${d.phase}</p>
    ${d.quality !== null ? `<p><b>Quality:</b> ${d.quality}</p>` : ""}
    <table>
      <tr><td>Temperature</td><td>${fromSI("T", d.T).toFixed(2)} ${unitLabel("T")}</td></tr>
      <tr><td>Pressure</td><td>${fromSI("P", d.P).toFixed(4)} ${unitLabel("P")}</td></tr>
      <tr><td>Density</td><td>${fromSI("D", d.density).toFixed(4)} ${unitLabel("D")}</td></tr>
      <tr><td>Specific Volume</td><td>${(1/d.density).toExponential(4)} m³/kg</td></tr>
      <tr><td>cp</td><td>${d.cp.toFixed(2)} J/kg·K</td></tr>
      <tr><td>cv</td><td>${d.cv.toFixed(2)} J/kg·K</td></tr>
      <tr><td>Entropy</td><td>${fromSI("S", d.entropy).toFixed(3)} ${unitLabel("S")}</td></tr>
      <tr><td>Enthalpy</td><td>${fromSI("H", d.enthalpy).toFixed(2)} ${unitLabel("H")}</td></tr>
      <tr><td>Conductivity</td><td>${d.conductivity.toFixed(4)} W/m·K</td></tr>
      ${d.viscosity !== null
        ? `<tr><td>Viscosity</td><td>${d.viscosity.toExponential(4)} Pa·s</td></tr>`
        : ""}
    </table>
  `;

  plotCharts(d);
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
