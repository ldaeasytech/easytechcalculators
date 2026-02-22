export const formulas = {

  /* ================= BASIC ================= */

  mass: {
    title: "Mass in Newton’s Second Law and Momentum",
    formula: "F = m·a",
    note: `
Mass is a fundamental property of matter.

Used in:
• Newton’s Second Law (F = m·a)
• Momentum (p = m·v)
• Energy (E = mc²)

SI Base Unit: kilogram (kg)
Dimension: [M]
`
  },

  length: {
    title: "Length in Geometry and Kinematics",
    formula: "v = d / t",
    note: `
Length defines spatial dimension.

Used in:
• Geometry (Area = L², Volume = L³)
• Kinematics (v = d/t)
• Structural design

SI Base Unit: meter (m)
Dimension: [L]
`
  },

  time: {
    title: "Time in Dynamics and Energy Transfer",
    formula: "P = E / t",
    note: `
Time governs rate-dependent phenomena.

Used in:
• Velocity (v = d/t)
• Power (P = E/t)
• Oscillatory motion

SI Base Unit: second (s)
Dimension: [T]
`
  },

  temperature: {
    title: "Temperature in Thermodynamics",
    formula: "Kelvin-based normalization",
    note: `
Temperature measures thermal energy level.

Conversions require offset normalization:
°C ↔ K ↔ °F

Used in:
• Heat transfer
• Ideal gas law
• Phase change analysis

SI Base Unit: Kelvin (K)
Dimension: [Θ]
`
  },

  area: {
    title: "Area in Pressure and Heat Transfer",
    formula: "A = L²",
    note: `
Area represents two-dimensional space.

Used in:
• Pressure (P = F/A)
• Heat transfer (q = hAΔT)
• Flow calculations

SI Unit: m²
Dimension: [L²]
`
  },

  /* ================= MECHANICAL ================= */

  force: {
    title: "Force in Newton’s Second Law",
    formula: "F = m·a",
    note: `
Force causes acceleration.

1 N = 1 kg·m/s²

Used in:
• Structural mechanics
• Fluid pressure
• Dynamics

Dimension: [M L T⁻²]
`
  },

  pressure: {
    title: "Pressure in Fluid Mechanics and Thermodynamics",
    formula: "P = F / A",
    note: `
Pressure is force per unit area.

1 Pa = 1 N/m²

Used in:
• Bernoulli equation
• Pump calculations
• Gas laws

Dimension: [M L⁻¹ T⁻²]
`
  },

  energy: {
    title: "Energy in Work and Thermodynamics",
    formula: "E = F·d",
    note: `
Energy represents work capacity.

1 J = 1 N·m

Used in:
• Mechanical work
• Heat transfer
• Electrical systems

Dimension: [M L² T⁻²]
`
  },

  power: {
    title: "Power in Energy Transfer Rate",
    formula: "P = E / t",
    note: `
Power measures rate of energy transfer.

1 W = 1 J/s

Used in:
• Pump sizing
• Electrical systems
• Thermal systems

Dimension: [M L² T⁻³]
`
  },

  momentum: {
    title: "Momentum in Conservation Laws",
    formula: "p = m·v",
    note: `
Momentum is conserved in isolated systems.

Used in:
• Impact analysis
• Fluid jets
• Rocket propulsion

Dimension: [M L T⁻¹]
`
  },

  torque: {
    title: "Torque in Rotational Mechanics",
    formula: "τ = F·r",
    note: `
Torque causes rotational acceleration.

Used in:
• Shaft design
• Motor sizing
• Structural analysis

Dimension: [M L² T⁻²]
`
  },

  density: {
    title: "Density in Fluid Mechanics",
    formula: "ρ = m / V",
    note: `
Density relates mass to volume.

Used in:
• Reynolds number
• Buoyancy force
• Mass flow rate (ṁ = ρQ)

Dimension: [M L⁻³]
`
  },

  viscosityDynamic: {
    title: "Dynamic Viscosity in Shear Flow",
    formula: "τ = μ (du/dy)",
    note: `
Dynamic viscosity measures resistance to shear deformation.

Used in:
• Navier–Stokes equations
• Pipe friction loss
• Lubrication systems

Dimension: [M L⁻¹ T⁻¹]
`
  },

  viscosityKinematic: {
    title: "Kinematic Viscosity in Fluid Flow",
    formula: "ν = μ / ρ",
    note: `
Kinematic viscosity relates viscosity to density.

Used in:
• Reynolds number (Re = vD/ν)
• Turbulence analysis

Dimension: [L² T⁻¹]
`
  },

  flowRateVol: {
    title: "Volumetric Flow Rate in Fluid Systems",
    formula: "Q = V / t",
    note: `
Volumetric flow rate measures volume per time.

Used in:
• Pump calculations
• Pipe sizing
• HVAC systems

Dimension: [L³ T⁻¹]
`
  },

  flowRateMass: {
    title: "Mass Flow Rate in Continuity Equation",
    formula: "ṁ = ρQ",
    note: `
Mass flow rate combines density and volumetric flow.

Used in:
• Energy balance
• Chemical processing
• Thermal systems

Dimension: [M T⁻¹]
`
  },

  velocity: {
    title: "Velocity in Kinematics and Fluid Mechanics",
    formula: "v = d / t",
    note: `
Velocity measures rate of displacement.

Used in:
• Reynolds number
• Bernoulli equation
• Pipe friction loss

Dimension: [L T⁻¹]
`
  },

  /* ================= THERMAL ================= */

  thermalConductivity: {
    title: "Thermal Conductivity in Fourier’s Law of Heat Conduction",
    formula: "q = -k ∇T",
    note: `
Thermal conductivity (k) quantifies heat conduction.

Appears in Fourier’s Law:
q = -k ∇T

Used in:
• Heat exchanger design
• Insulation analysis
• Steady-state conduction

Dimension: [M L T⁻³ Θ⁻¹]
`
  },

  heatTransferCoeff: {
    title: "Convective Heat Transfer Coefficient",
    formula: "q = hAΔT",
    note: `
The heat transfer coefficient describes convection
between a surface and a moving fluid.

Used in:
• Heat exchangers
• Cooling systems
• HVAC design

Dimension: [M T⁻³ Θ⁻¹]
`
  },

  specificHeat: {
    title: "Specific Heat Capacity in Energy Balance",
    formula: "Q = m c ΔT",
    note: `
Specific heat capacity defines energy required
to raise temperature per unit mass.

Used in:
• Energy balance
• Thermal storage
• Heating/cooling calculations

Dimension: [L² T⁻² Θ⁻¹]
`
  }

};
