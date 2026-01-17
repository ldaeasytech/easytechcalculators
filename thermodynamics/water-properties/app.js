
const API_URL = "https://api.easytechcalculators.com/api/water";

let chartTS, chartHS;

function updateInputs() {
  const pair = document.getElementById("pair").value;
  const unit = document.getElementById("unitSystem").value;
  const inputsDiv = document.getElementById("inputs");

  let html = "";

  const units = {
    SI: {
      T: "°C",
      P: "MPa",
      h: "kJ/kg",
      s: "kJ/kg·K",
      rho: "kg/m³",
      x: "-"
    },
    ENG: {
      T: "°F",
      P: "psia",
      h: "Btu/lbm",
      s: "Btu/lbm·R",
      rho: "lbm/ft³",
      x: "-"
    }
  };

  const u = units[unit];

  if (pair === "PT") {
    html = `
      <label>Temperature (${u.T})</label>
      <input id="v1" type="number" step="any">
      <label>Pressure (${u.P})</label>
      <input id="v2" type="number" step="any">
    `;
  } else if (pair === "Px") {
    html = `
      <label>Pressure (${u.P})</label>
      <input id="v1" type="number" step="any">
      <label>Quality (x)</label>
      <input id="v2" type="number" step="any">
    `;
  } else if (pair === "Tx") {
    html = `
      <label>Temperature (${u.T})</label>
      <input id="v1" type="number" step="any">
      <label>Quality (x)</label>
      <input id="v2" type="number" step="any">
    `;
  } else if (pair === "Ph") {
    html = `
      <label>Pressure (${u.P})</label>
      <input id="v1" type="number" step="any">
      <label>Enthalpy (${u.h})</label>
      <input id="v2" type="number" step="any">
    `;
  } else if (pair === "Ps") {
    html = `
      <label>Pressure (${u.P})</label>
      <input id="v1" type="number" step="any">
      <label>Entropy (${u.s})</label>
      <input id="v2" type="number" step="any">
    `;
  } else if (pair === "hs") {
    html = `
      <label>Enthalpy (${u.h})</label>
      <input id="v1" type="number" step="any">
      <label>Entropy (${u.s})</label>
      <input id="v2" type="number" step="any">
    `;
  } else if (pair === "rhoT") {
    html = `
      <label>Density (${u.rho})</label>
      <input id="v1" type="number" step="any">
      <label>Temperature (${u.T})</label>
      <input id="v2" type="number" step="any">
    `;
  }

  inputsDiv.innerHTML = html;
}

async function solve() {
  const unit = document.getElementById("unitSystem").value;
  const pair = document.getElementById("pair").value;
  const v1 = document.getElementById("v1").value;
  const v2 = document.getElementById("v2").value;
  const outputDiv = document.getElementById("output");

  outputDiv.innerHTML = "Calculating...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit, pair, v1, v2 })
    });

    const data = await response.json();

    if (!data.success) {
      outputDiv.innerHTML = "Error: " + data.error;
      return;
    }

    renderOutput(data);
    drawCharts(data.results);
  } catch (err) {
    outputDiv.innerHTML = "Server error. Please try again later.";
    console.error(err);
  }
}

function renderOutput(data) {
  const r = data.results;
  const unit = document.getElementById("unitSystem").value;

  const units = unit === "SI" ? {
    T: "°C",
    P: "MPa",
    rho: "kg/m³",
    v: "m³/kg",
    h: "kJ/kg",
    s: "kJ/kg·K",
    cp: "kJ/kg·K",
    cv: "kJ/kg·K",
    k: "W/m·K",
    mu: "Pa·s"
  } : {
    T: "°F",
    P: "psia",
    rho: "lbm/ft³",
    v: "ft³/lbm",
    h: "Btu/lbm",
    s: "Btu/lbm·R",
    cp: "Btu/lbm·R",
    cv: "Btu/lbm·R",
    k: "Btu/hr·ft·R",
    mu: "lbm/ft·s"
  };

  document.getElementById("output").innerHTML = `
    <h2>Results</h2>
    <p><strong>Region:</strong> ${data.region}</p>
    <table class="results-table">
      <tr><td>Temperature</td><td>${r.T.toFixed(4)}</td><td>${units.T}</td></tr>
      <tr><td>Pressure</td><td>${r.P.toFixed(4)}</td><td>${units.P}</td></tr>
      <tr><td>Density</td><td>${r.rho.toFixed(4)}</td><td>${units.rho}</td></tr>
      <tr><td>Specific Volume</td><td>${r.v.toFixed(6)}</td><td>${units.v}</td></tr>
      <tr><td>Enthalpy</td><td>${r.h.toFixed(4)}</td><td>${units.h}</td></tr>
      <tr><td>Entropy</td><td>${r.s.toFixed(6)}</td><td>${units.s}</td></tr>
      <tr><td>Cp</td><td>${r.cp.toFixed(4)}</td><td>${units.cp}</td></tr>
      <tr><td>Cv</td><td>${r.cv.toFixed(4)}</td><td>${units.cv}</td></tr>
      <tr><td>Thermal Conductivity</td><td>${r.k.toExponential(4)}</td><td>${units.k}</td></tr>
      <tr><td>Viscosity</td><td>${r.mu.toExponential(4)}</td><td>${units.mu}</td></tr>
    </table>
  `;
}

function drawCharts(r) {
  const s = r.s;
  const T = r.T;
  const h = r.h;

  if (chartTS) chartTS.destroy();
  if (chartHS) chartHS.destroy();

  chartTS = new Chart(document.getElementById("chartTS"), {
    type: "scatter",
    data: {
      datasets: [{
        label: "State Point",
        data: [{ x: s, y: T }],
        pointRadius: 6
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Entropy" } },
        y: { title: { display: true, text: "Temperature" } }
      }
    }
  });

  chartHS = new Chart(document.getElementById("chartHS"), {
    type: "scatter",
    data: {
      datasets: [{
        label: "State Point",
        data: [{ x: s, y: h }],
        pointRadius: 6
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Entropy" } },
        y: { title: { display: true, text: "Enthalpy" } }
      }
    }
  });
}

// Initialize inputs on page load
updateInputs();
