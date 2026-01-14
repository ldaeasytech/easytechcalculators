const API = "https://api.easytechcalculators.com/water/state";

function row(label, value, unit) {
  return `<tr><td>${label}</td><td>${value.toFixed(5)}</td><td>${unit}</td></tr>`;
}

async function solve() {

  const body = {
    input1_name: document.getElementById("i1n").value,
    input1_value: parseFloat(document.getElementById("i1v").value),
    input2_name: document.getElementById("i2n").value,
    input2_value: parseFloat(document.getElementById("i2v").value)
  };

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const d = await res.json();

  document.getElementById("output").innerHTML = `
    <h3>Results</h3>
    <p><b>Phase:</b> ${d.phase}</p>
    ${d.quality !== null ? `<p><b>Quality:</b> ${d.quality}</p>` : ""}
    <table>
      ${row("Temperature", d.T, "K")}
      ${row("Pressure", d.P, "Pa")}
      ${row("Density", d.density, "kg/m³")}
      ${row("Specific Volume", d.specific_volume, "m³/kg")}
      ${row("Cp", d.cp, "J/kg·K")}
      ${row("Cv", d.cv, "J/kg·K")}
      ${row("Entropy", d.entropy, "J/kg·K")}
      ${row("Enthalpy", d.enthalpy, "J/kg")}
      ${row("Conductivity", d.conductivity, "W/m·K")}
      ${row("Viscosity", d.viscosity, "Pa·s")}
    </table>
  `;
}
