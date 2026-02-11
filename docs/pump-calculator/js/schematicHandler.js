// schematicHandler.js

const relationSelect =
  document.getElementById("elevationRelation");

const referenceSelect =
  document.getElementById("elevationReference");

const container =
  document.getElementById("schematicContainer");

function updateSchematic() {

  const relation = relationSelect.value;
  const reference = referenceSelect.value;

  let description = "";

  if (reference === "pipe") {

    if (relation === "above") {
      description =
        "Source ABOVE discharge\nElevation measured to pipe outlet\nv₂ = pipe velocity\nK_exit = 0";
    } else {
      description =
        "Source BELOW discharge\nElevation measured to pipe outlet\nv₂ = pipe velocity\nK_exit = 0";
    }

  } else {

    if (relation === "above") {
      description =
        "Source ABOVE sink surface\nElevation measured between liquid surfaces\nv₂ = sink velocity\nK_exit = 1";
    } else {
      description =
        "Source BELOW sink surface\nElevation measured between liquid surfaces\nv₂ = sink velocity\nK_exit = 1";
    }
  }

  container.innerHTML =
    `<pre style="white-space:pre-line;">${description}</pre>`;
}

relationSelect.addEventListener("change", updateSchematic);
referenceSelect.addEventListener("change", updateSchematic);

updateSchematic();
