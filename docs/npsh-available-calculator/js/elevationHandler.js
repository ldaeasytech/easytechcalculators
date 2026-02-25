// elevationHandler.js

const elevationSelect =
  document.getElementById("elevationReference");

const sinkVelocityField =
  document.getElementById("sinkVelocityField");

export function getElevationReference() {
  return elevationSelect.value;
}

export function getSinkVelocity() {
  return Number(
    document.getElementById("sinkVelocity").value
  ) || 0;
}

function updateElevationUI() {

  if (elevationSelect.value === "sink") {
    sinkVelocityField.style.display = "block";
  } else {
    sinkVelocityField.style.display = "none";
  }
}

elevationSelect.addEventListener("change", updateElevationUI);

updateElevationUI();
