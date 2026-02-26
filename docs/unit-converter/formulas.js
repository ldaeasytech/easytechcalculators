export const formulas = {

/* ================= BASIC ================= */

mass: {
  title: "Mass in Newton’s Second Law and Momentum",
  formula: "F = m·a",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Physical Meaning</strong>
      <p>Mass is a fundamental property of matter and a measure of inertia.</p>
    </div>

    <div class="note-section">
      <strong>Key Relations</strong>
      <ul>
        <li>Newton’s Second Law: F = m·a</li>
        <li>Momentum: p = m·v</li>
        <li>Relativistic Energy: E = mc²</li>
      </ul>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M]</p>
    </div>
  </div>
  `
},

length: {
  title: "Length in Geometry and Kinematics",
  formula: "v = d / t",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Physical Meaning</strong>
      <p>Length defines spatial dimension and geometric scale.</p>
    </div>

    <div class="note-section">
      <strong>Applications</strong>
      <ul>
        <li>Geometry (Area = L², Volume = L³)</li>
        <li>Kinematics (v = d/t)</li>
        <li>Structural analysis</li>
      </ul>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[L]</p>
    </div>
  </div>
  `
},

time: {
  title: "Time in Dynamics and Energy Transfer",
  formula: "P = E / t",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Physical Meaning</strong>
      <p>Time governs rate-dependent physical processes.</p>
    </div>

    <div class="note-section">
      <strong>Applications</strong>
      <ul>
        <li>Velocity (v = d/t)</li>
        <li>Power (P = E/t)</li>
        <li>Oscillatory systems</li>
      </ul>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[T]</p>
    </div>
  </div>
  `
},

temperature: {
  title: "Temperature in Thermodynamics",
  formula: "Kelvin-based normalization",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Physical Meaning</strong>
      <p>Temperature measures thermal energy level.</p>
    </div>

    <div class="note-section">
      <strong>Conversion Principle</strong>
      <p>Temperature conversions require offset normalization:
      °C ↔ K ↔ °F</p>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[Θ]</p>
    </div>
  </div>
  `
},

area: {
  title: "Area in Pressure and Heat Transfer",
  formula: "A = L²",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Physical Meaning</strong>
      <p>Area represents two-dimensional spatial extent.</p>
    </div>

    <div class="note-section">
      <strong>Applications</strong>
      <ul>
        <li>Pressure (P = F/A)</li>
        <li>Heat transfer (q = hAΔT)</li>
        <li>Flow calculations</li>
      </ul>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[L²]</p>
    </div>
  </div>
  `
},

/* ================= MECHANICAL ================= */

force: {
  title: "Force in Newton’s Second Law",
  formula: "F = m·a",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Definition</strong>
      <p>Force causes acceleration in a body.</p>
    </div>

    <div class="note-section">
      <strong>SI Definition</strong>
      <p>1 N = 1 kg·m/s²</p>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M L T⁻²]</p>
    </div>
  </div>
  `
},

pressure: {
  title: "Pressure in Fluid Mechanics",
  formula: "P = F / A",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Definition</strong>
      <p>Pressure is force per unit area.</p>
    </div>

    <div class="note-section">
      <strong>SI Definition</strong>
      <p>1 Pa = 1 N/m²</p>
    </div>

    <div class="note-section">
      <strong>Applications</strong>
      <ul>
        <li>Bernoulli equation</li>
        <li>Pump systems</li>
        <li>Gas laws</li>
      </ul>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M L⁻¹ T⁻²]</p>
    </div>
  </div>
  `
},

energy: {
  title: "Energy in Work and Thermodynamics",
  formula: "E = F·d",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Definition</strong>
      <p>Energy represents the capacity to perform work.</p>
    </div>

    <div class="note-section">
      <strong>SI Definition</strong>
      <p>1 J = 1 N·m</p>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M L² T⁻²]</p>
    </div>
  </div>
  `
},

power: {
  title: "Power in Energy Transfer Rate",
  formula: "P = E / t",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Definition</strong>
      <p>Power measures the rate of energy transfer.</p>
    </div>

    <div class="note-section">
      <strong>SI Definition</strong>
      <p>1 W = 1 J/s</p>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M L² T⁻³]</p>
    </div>
  </div>
  `
},

momentum: {
  title: "Momentum in Conservation Laws",
  formula: "p = m·v",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Definition</strong>
      <p>Momentum is conserved in isolated systems.</p>
    </div>

    <div class="note-section">
      <strong>Relation</strong>
      <p>p = m·v</p>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M L T⁻¹]</p>
    </div>
  </div>
  `
},

/* ================= THERMAL ================= */

thermalConductivity: {
  title: "Thermal Conductivity in Fourier’s Law",
  formula: "q = −k ∇T",
  note: `
  <div class="note-block">
    <div class="note-section">
      <strong>Physical Meaning</strong>
      <p>Thermal conductivity (k) quantifies a material’s ability to conduct heat.</p>
    </div>

    <div class="note-section">
      <strong>Governing Law</strong>
      <p>q = −k ∇T (Fourier’s Law of Heat Conduction)</p>
    </div>

    <div class="note-section">
      <strong>Applications</strong>
      <ul>
        <li>Heat exchanger design</li>
        <li>Insulation analysis</li>
        <li>Steady-state conduction</li>
      </ul>
    </div>

    <div class="note-section">
      <strong>Dimension</strong>
      <p>[M L T⁻³ Θ⁻¹]</p>
    </div>
  </div>
  `
}

};
