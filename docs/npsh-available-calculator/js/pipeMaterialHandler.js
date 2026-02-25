// pipeMaterialHandler.js

import { PIPE_ROUGHNESS } from "./data/pipeRoughness.js";

const materialSelect =
  document.getElementById("pipeMaterial");

const steelOptions =
  document.getElementById("steelOptions");

const customField =
  document.getElementById("customDiameterField");

/* ============================
   Populate Material Dropdown
============================ */
Object.keys(PIPE_ROUGHNESS).forEach(mat => {
  const opt = document.createElement("option");
  opt.value = mat;
  opt.textContent = mat;
  materialSelect.appendChild(opt);
});

/* ============================
   UI Switching
============================ */
function updateMaterialUI() {

  if (materialSelect.value === "Commercial steel") {
    steelOptions.style.display = "block";
    customField.style.display = "none";
  } else {
    steelOptions.style.display = "none";
    customField.style.display = "block";
  }
}

materialSelect.addEventListener("change", updateMaterialUI);

updateMaterialUI();

/* ============================
   Export Diameter Getter
============================ */
export function getPipeDiameter(PIPE_ID) {

  const material = materialSelect.value;

  if (material === "Commercial steel") {

    const nps =
      document.getElementById("pipeNPS").value;

    const schedule =
      document.getElementById("pipeSchedule").value;

    return PIPE_ID[nps][schedule];

  } else {

    return Number(
      document.getElementById("customDiameter").value
    );
  }
}

export function getPipeMaterial() {
  return materialSelect.value;
}
