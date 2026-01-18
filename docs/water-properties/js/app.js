import { solve } from "./solver.js";
import { validateState } from "./validator.js";
import { toSI, fromSI } from "./unitConverter.js";
import { estimateConfidence } from "./confidence.js";

document.getElementById("calcForm").addEventListener("submit", e => {
  e.preventDefault();

  clearMessages();
  document.getElementById("loading").style.display = "block";

  try {
    const inputs = readInputs();
    const unitSystem = document.getElementById("unitSystem").value;

    const si = toSI(inputs, unitSystem);
    const validation = validateState(si);

    if (!validation.valid) {
      show(validation);
      return;
    }

    const stateSI = solve(si);
    const stateUI = fromSI(stateSI, unitSystem);

    const confidence = {};
    for (const k in stateUI) {
      confidence[k] = estimateConfidence(k, stateUI.phase);
    }

    renderResults(stateUI, confidence);
  } catch (err) {
    document.getElementById("errors").textContent = err.message;
  } finally {
    document.getElementById("loading").style.display = "none";
  }
});

function readInputs() {
  const map = {
    temperature:"T", pressure:"P", enthalpy:"h",
    entropy:"s", specificVolume:"v", quality:"x"
  };
  const data = {};
  for (const id in map) {
    const el = document.getElementById(id);
    if (!el.disabled && el.value !== "") {
      data[map[id]] = parseFloat(el.value);
    }
  }
  return data;
}

function renderResults(state, confidence) {
  const labels = {
    density:"Density", specificVolume:"Specific Volume",
    enthalpy:"Enthalpy", entropy:"Entropy",
    cp:"Cp", cv:"Cv",
    viscosity:"Viscosity",
    thermalConductivity:"Thermal Conductivity"
  };

  const rows = Object.keys(labels)
    .filter(k => state[k] !== undefined)
    .map(k => `
      <tr>
        <td>${labels[k]}</td>
        <td class="value">${state[k].toFixed(6)}</td>
        <td>${confidence[k]?.confidence_band ?? "—"}</td>
      </tr>`).join("");

  document.getElementById("resultsTable").innerHTML = `
    <table>
      <tr><th>Property</th><th>Value</th><th>Confidence</th></tr>
      ${rows}
    </table>`;
}

function show(v) {
  document.getElementById("errors").innerHTML = v.errors.join("<br>");
  document.getElementById("warnings").innerHTML = v.warnings.join("<br>");
  document.getElementById("suggestions").innerHTML = v.suggestions.join("<br>");
}

function clearMessages() {
  ["errors","warnings","suggestions"].forEach(id =>
    document.getElementById(id).innerHTML = ""
  );
}
