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

  const v2Label = isPipeRef ? "v₂ = v" : "v₂ = 0";
  const kExitLabel = isPipeRef ? "K_exit = 0" : "K_exit = 1";

  return `
<svg viewBox="0 0 700 320" width="100%" height="100%"
     xmlns="http://www.w3.org/2000/svg">

<style>
.pipe { stroke:#d1d5db; stroke-width:6; fill:none; }
.tank { stroke:#94a3b8; stroke-width:2; fill:none; }
.water { fill:url(#waterGrad); }
.label { fill:#e5e7eb; font-size:12px; font-family:Segoe UI, sans-serif; }
.head { fill:#60a5fa; font-size:13px; font-weight:600; }
.pump { stroke:#facc15; stroke-width:3; fill:none; }
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

<!-- TANK -->
<rect x="40" y="${tankY}" width="130" height="120"
      class="tank"/>

<rect x="40" y="${tankY + 60}"
      width="130" height="60"
      class="water"/>

<text x="45" y="${tankY - 8}"
      class="label">
  Source
</text>

<!-- SUCTION PIPE -->
<line x1="170" y1="${tankY + 80}"
      x2="290" y2="${pumpY}"
      class="pipe"/>

<!-- PUMP -->
<circle cx="310" cy="${pumpY}"
        r="22"
        class="pump"/>
<polygon points="${300},${pumpY-10}
                 ${300},${pumpY+10}
                 ${325},${pumpY}"
         fill="#facc15"/>

<text x="310" y="${pumpY + 40}"
      text-anchor="middle"
      class="label">
  Pump
</text>

<!-- DISCHARGE PIPE -->
<line x1="332" y1="${pumpY}"
      x2="600" y2="${dischargeY}"
      class="pipe"
      marker-end="url(#arrow)"/>

<!-- DISCHARGE OUTLET -->
<line x1="600" y1="${dischargeY}"
      x2="600" y2="${dischargeY - 30}"
      class="pipe"/>

<text x="605" y="${dischargeY - 35}"
      class="label">
  Discharge
</text>

<!-- ELEVATION ARROW -->
<line x1="220"
      y1="${tankY + 60}"
      x2="220"
      y2="${dischargeY}"
      stroke="#60a5fa"
      stroke-width="2"
      marker-end="url(#arrow)"/>

<text x="228"
      y="${(tankY + dischargeY)/2}"
      class="head">
  h
</text>

<!-- DYNAMIC LABELS -->
<text x="80" y="${tankY + 55}"
      class="label">
  P₁
</text>

<text x="550" y="${dischargeY + 20}"
      class="label">
  P₂
</text>

<text x="90" y="${tankY + 100}"
      class="label">
  v₁ = 0
</text>

<text x="480" y="${dischargeY - 10}"
      class="label">
  ${v2Label}
</text>

<text x="420" y="${dischargeY + 50}"
      class="label">
  ${kExitLabel}
</text>

</svg>
`;
}
