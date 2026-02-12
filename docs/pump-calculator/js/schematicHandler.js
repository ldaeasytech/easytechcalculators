// schematicHandler.js

const relationSelect =
  document.getElementById("elevationRelation");

const referenceSelect =
  document.getElementById("elevationReference");

const container =
  document.getElementById("schematicContainer");

/* ============================
   MAIN UPDATE
============================ */

function updateSchematic() {

  const relation = relationSelect.value;
  const reference = referenceSelect.value;

  container.innerHTML = generateSVG(relation, reference);
}

relationSelect.addEventListener("change", updateSchematic);
referenceSelect.addEventListener("change", updateSchematic);

updateSchematic();

/* ============================
   SVG GENERATOR
============================ */

function generateSVG(relation, reference) {

  const isAbove = relation === "above";
  const isPipeRef = reference === "pipe";

  const tankY = isAbove ? 40 : 150;
  const pumpY = isAbove ? 190 : 130;
  const dischargeY = 80;

  const sinkY = dischargeY + 10;

  const v2Label = isPipeRef ? "v₂ = v" : "v₂ = 0";
  const kExitLabel = isPipeRef ? "K_exit = 0" : "K_exit = 1";

  return `
<svg viewBox="0 0 800 360" width="100%" height="100%"
     xmlns="http://www.w3.org/2000/svg">

<style>
.pipe { stroke:#d1d5db; stroke-width:6; fill:none; }
.tank { stroke:#94a3b8; stroke-width:2; fill:none; }
.water { fill:url(#waterGrad); }
.label { fill:#e5e7eb; font-size:13px; font-family:Segoe UI, sans-serif; }
.head { fill:#60a5fa; font-size:14px; font-weight:600; }
.pump-body { stroke:#facc15; stroke-width:4; fill:none; }
.impeller { stroke:#facc15; stroke-width:2; fill:none; }
.nozzle { stroke:#d1d5db; stroke-width:4; }
</style>

<defs>
  <linearGradient id="waterGrad" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#38bdf8"/>
    <stop offset="100%" stop-color="#0ea5e9"/>
  </linearGradient>

  <marker id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="5"
          refY="4"
          orient="auto">
    <path d="M0,0 L8,4 L0,8 Z"
          fill="#d1d5db"/>
  </marker>
</defs>

<!-- SOURCE TANK -->
<rect x="40" y="${tankY}" width="130" height="120" class="tank"/>
<rect x="40" y="${tankY + 60}" width="130" height="60" class="water"/>
<text x="45" y="${tankY - 8}" class="label">Source</text>

<!-- SUCTION PIPE -->
<line x1="170" y1="${tankY + 80}"
      x2="300" y2="${pumpY}"
      class="pipe"/>

<!-- PUMP (Improved Centrifugal Style) -->
<circle cx="330" cy="${pumpY}" r="28" class="pump-body"/>
<circle cx="330" cy="${pumpY}" r="10" class="impeller"/>
<line x1="330" y1="${pumpY-10}" x2="330" y2="${pumpY+10}" class="impeller"/>
<line x1="320" y1="${pumpY}" x2="340" y2="${pumpY}" class="impeller"/>

<!-- Shaft -->
<line x1="358" y1="${pumpY}" x2="380" y2="${pumpY}" 
      stroke="#facc15" stroke-width="4"/>

<text x="330" y="${pumpY + 50}" text-anchor="middle" class="label">
  Centrifugal Pump
</text>

<!-- DISCHARGE PIPE -->
<line x1="380" y1="${pumpY}"
      x2="620" y2="${dischargeY}"
      class="pipe"
      marker-end="url(#arrow)"/>

<!-- DISCHARGE NOZZLE -->
<polygon points="620,${dischargeY-12}
                 660,${dischargeY}
                 620,${dischargeY+12}"
         fill="#d1d5db"/>

<text x="600" y="${dischargeY - 20}" class="label">
  Discharge
</text>

<!-- SINK TANK -->
<rect x="670" y="${sinkY}" width="120" height="100" class="tank"/>
<rect x="670" y="${sinkY + 50}" width="120" height="50" class="water"/>

<text x="675" y="${sinkY - 8}" class="label">
  Sink
</text>

<!-- ELEVATION ARROW -->
<line x1="240"
      y1="${tankY + 60}"
      x2="240"
      y2="${dischargeY}"
      stroke="#60a5fa"
      stroke-width="2"
      marker-end="url(#arrow)"/>

<text x="248"
      y="${(tankY + dischargeY)/2}"
      class="head">
  h
</text>

<!-- DYNAMIC LABELS -->
<text x="90" y="${tankY + 100}" class="label">
  v₁ = 0
</text>

<text x="520" y="${dischargeY - 10}" class="label">
  ${v2Label}
</text>

<text x="470" y="${dischargeY + 40}" class="label">
  ${kExitLabel}
</text>

<text x="80" y="${tankY + 50}" class="label">P₁</text>
<text x="600" y="${dischargeY + 20}" class="label">P₂</text>

</svg>
`;
}
