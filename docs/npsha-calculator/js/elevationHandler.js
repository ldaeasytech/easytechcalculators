// elevationHandler.js

const elevationSelect =
  document.getElementById("elevationReference");

export function getElevationReference() {
  return elevationSelect.value;
}

export function getSinkVelocity() {
  return Number(
    document.getElementById("sinkVelocity").value
  ) || 0;
}

updateElevationUI();
