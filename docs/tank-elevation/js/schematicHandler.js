// schematicHandler.js

const relationSelect = "above";

const referenceSelect = "pipe";

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

  const tankY = isAbove ? 40 : 150;
  const pumpY = isAbove ? 190 : 130;
  const dischargeY = 90;
  const sinkY = dischargeY + 20;

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
</style>

<defs>
  <linearGradient id="waterGrad" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#38bdf8"/>
    <stop offset="100%" stop-color="#0ea5e9"/>
  </linearGradient>

  <marker id="flowArrow"
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
<rect x="40" y="${tankY}" width="130" height="120" class="tank"/>
<rect x="40" y="${tankY + 60}" width="130" height="60" class="water"/>
<text x="45" y="${tankY - 8}" class="label">Source</text>
<text x="85" y="${tankY + 100}" class="label">v₁ = 0</text>
<text x="85" y="${tankY + 50}" class="label">P₁</text>

<!-- SUCTION PIPE -->
<line x1="170" y1="${tankY + 80}"
      x2="300" y2="${pumpY}"
      class="pipe"/>

<!-- PUMP -->
<circle cx="330" cy="${pumpY}" r="28" class="pump-body"/>
<circle cx="330" cy="${pumpY}" r="10" class="impeller"/>
<line x1="330" y1="${pumpY-10}" x2="330" y2="${pumpY+10}" class="impeller"/>
<line x1="320" y1="${pumpY}" x2="340" y2="${pumpY}" class="impeller"/>
<line x1="358" y1="${pumpY}" x2="380" y2="${pumpY}" 
      stroke="#facc15" stroke-width="4"/>

<text x="330" y="${pumpY + 50}" text-anchor="middle" class="label">
  Centrifugal Pump
</text>

<!-- DISCHARGE PIPE -->
<line x1="380" y1="${pumpY}"
      x2="600" y2="${dischargeY}"
      class="pipe"/>

<!-- FLOW DIRECTION ARROW (moved upward) -->
<line x1="470" 
      y1="${(pumpY + dischargeY)/2 - 25}"
      x2="520" 
      y2="${(pumpY + dischargeY)/2 - 25}"
      stroke="#d1d5db"
      stroke-width="3"
      marker-end="url(#flowArrow)"/>

<text x="495"
      y="${(pumpY + dischargeY)/2 - 35}"
      text-anchor="middle"
      class="label">
  Flow Direction
</text>



<!-- CLEAN NOZZLE (Reducer + Outlet) -->
<polygon points="600,${dischargeY-10}
                 630,${dischargeY}
                 600,${dischargeY+10}"
         fill="#d1d5db"/>

<text x="590" y="${dischargeY - 18}" class="label">
  Discharge
</text>

<text x="600" y="${dischargeY + 20}" class="label">
  P₂
</text>

<!-- SINK TANK -->
<rect x="660" y="${sinkY}" width="120" height="100" class="tank"/>
<rect x="660" y="${sinkY + 50}" width="120" height="50" class="water"/>
<text x="665" y="${sinkY - 8}" class="label">Sink</text>

<!-- ELEVATION ARROW (shifted left so no intersection) -->
<line x1="230"
      y1="${tankY + 50}"
      x2="230"
      y2="${dischargeY - 20}"
      stroke="#60a5fa"
      stroke-width="3"
      marker-end="url(#headArrow)"/>

<text x="240"
      y="${(tankY + dischargeY)/2}"
      class="head">
  h
</text>

</svg>
`;
}

