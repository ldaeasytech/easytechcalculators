const API = "https://api.easytechcalculators.com/water/state";

const PAIRS = {
  PT: [
    ["T", "Temperature (K)"],
    ["P", "Pressure (Pa)"]
  ],
  Px: [
    ["P", "Pressure (Pa)"],
    ["X", "Quality (0–1)"]
  ],
  Tx: [
    ["T", "Temperature (K)"],
    ["X", "Quality (0–1)"]
  ],
  Ph: [
    ["P", "Pressure (Pa)"],
    ["H", "Enthalpy (J/kg)"]
  ],
  Ps: [
    ["P", "Pressure (Pa)"],
    ["S", "Entropy (J/kg·K)"]
  ],
  hs: [
    ["H", "Enthalpy (J/kg)"],
    ["S", "Entropy (J/kg·K)"]
  ],
  rhoT: [
    ["D", "Density (kg/m³)"],
    ["T", "Temperature (K)"]
  ]
};

function updateInputs() {
  const pair = document.getElementById("pair").value;
  const container = document.getElementById("inputs");
  container.innerHTML = "";

  PAIRS[pair].forEach((p, i) => {
    container.innerHTML += `
      <label>${p[1]}</label>
      <input id="v${i}" type="number" step="any">
      <input id="n${i}" type="hidden" value="${p[0]}">
    `;
  });
}

updateInputs();

async function solve() {
  const body = {
    input1_name: document.getElementById("n0").value,
    input1_value: parseFloat(document.getElementById("v0").value),
    input2_name: document.getElementById("n1").value,
    input2_value: parseFloat(document.getElementById("v1").value)
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
      <tr><td>Temperature</td><td>${d.T.toFixed(3)} K</td></tr>
      <tr><td>Pressure</td><td>${d.P.toExponential(4)} Pa</td></tr>
      <tr><td>Density</td><td>${d.density.toFixed(4)} kg/m³</td></tr>
      <tr><td>Specific Volume</td><td>${d.specific_volume.toExponential(4)} m³/kg</td></tr>
      <tr><td>cp</td><td>${d.cp.toFixed(2)} J/kg·K</td></tr>
      <tr><td>cv</td><td>${d.cv.toFixed(2)} J/kg·K</td></tr>
      <tr><td>Entropy</td><td>${d.entropy.toFixed(2)} J/kg·K</td></tr>
      <tr><td>Enthalpy</td><td>${d.enthalpy.toFixed(2)} J/kg</td></tr>
      <tr><td>Conductivity</td><td>${d.conductivity.toFixed(4)} W/m·K</td></tr>
      ${d.viscosity !== null
        ? `<tr><td>Viscosity</td><td>${d.viscosity.toExponential(4)} Pa·s</td></tr>`
        : ""}
    </table>
  `;
}
