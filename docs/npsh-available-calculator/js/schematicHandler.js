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

function generateSVG(relation) {

  const isAbove = relation === "above";

  const tankY = isAbove ? 40 : 170;
  const pumpY = isAbove ? 200 : 90;

  return `
<svg viewBox="0 0 820 360" width="100%" height="100%"
     xmlns="http://www.w3.org/2000/svg">

<style>
.pipe { stroke:#d1d5db; stroke-width:6; fill:none; }
.tank { stroke:#94a3b8; stroke-width:2; fill:none; }
.water { fill:url(#waterGrad); }
.label { fill:#e5e7eb; font-size:13px; font-family:Segoe UI, sans-serif; }
.head { fill:#60a5fa; font-size:14px; font-weight:600; }
.pump-body { stroke:#facc15; stroke-width:4; fill:none; }
.impeller { stroke:#facc15; stroke-width:2; fill:none; }
.suction { fill:#9ecbff; font-size:12px; }
</style>

<defs>
  <linearGradient id="waterGrad" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#38bdf8"/>
    <stop offset="100%" stop-color="#0ea5e9"/>
  </linearGradient>

  <marker id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto">
    <path d="M0,0 L8,4 L0,8 Z"
          fill="#d1d5db"/>
  </marker>

  <marker id="headArrow"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto">
    <path d="M0,0 L8,4 L0,8 Z"
          fill="#60a5fa"/>
  </marker>
</defs>

<!-- SOURCE TANK -->
<rect x="60" y="${tankY}" width="150" height="120" class="tank"/>
<rect x="60" y="${tankY + 60}" width="150" height="60" class="water"/>
<text x="65" y="${tankY - 10}" class="label">Source Tank</text>
<text x="105" y="${tankY + 50}" class="label">Pₐₜₘ</text>

<!-- SUCTION PIPE -->
<line x1="210" y1="${tankY + 80}"
      x2="400" y2="${pumpY}"
      class="pipe"/>

<text x="280"
      y="${(tankY + pumpY)/2 - 10}"
      class="suction">
  Suction Line
</text>

<!-- FLOW ARROW -->
<line x1="290"
      y1="${(tankY + pumpY)/2}"
      x2="340"
      y2="${(tankY + pumpY)/2}"
      stroke="#d1d5db"
      stroke-width="3"
      marker-end="url(#arrow)"/>

<!-- PUMP INLET -->
<circle cx="430" cy="${pumpY}" r="28" class="pump-body"/>
<circle cx="430" cy="${pumpY}" r="10" class="impeller"/>
<line x1="430" y1="${pumpY-10}" x2="430" y2="${pumpY+10}" class="impeller"/>
<line x1="420" y1="${pumpY}" x2="440" y2="${pumpY}" class="impeller"/>

<text x="430"
      y="${pumpY + 55}"
      text-anchor="middle"
      class="label">
  Pump Inlet
</text>

<!-- ELEVATION HEAD -->
<line x1="260"
      y1="${tankY + 50}"
      x2="260"
      y2="${pumpY}"
      stroke="#60a5fa"
      stroke-width="3"
      marker-end="url(#headArrow)"/>

<text x="270"
      y="${(tankY + pumpY)/2}"
      class="head">
  H_z
</text>

<!-- Vapor Pressure Label -->
<text x="450"
      y="${pumpY - 45}"
      class="label">
  Vapor Pressure (P_v)
</text>

</svg>
`;
}

