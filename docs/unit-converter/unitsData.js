export const quantityLabels = {
  mass: "Mass",
  length: "Length",
  time: "Time",
  temperature: "Temperature",
  area: "Area",

  velocity: "Velocity",
  force: "Force",
  pressure: "Pressure",
  energy: "Energy",
  power: "Power",
  momentum: "Momentum",
  torque: "Torque",
  density: "Density",

  viscosityDynamic: "Dynamic Viscosity (μ)",
  viscosityKinematic: "Kinematic Viscosity (ν)",

  flowRateVol: "Volumetric Flow Rate (Q)",
  flowRateMass: "Mass Flow Rate (ṁ)",

  thermalConductivity: "Thermal Conductivity (k)",
  heatTransferCoeff: "Heat Transfer Coefficient (h)",
  specificHeat: "Specific Heat Capacity (cₚ)"
};


export const units = {
/* =========================================================
   BASIC UNITS
========================================================= */

mass: {
  base: "kg",
  dim: { M: 1, L: 0, T: 0, Th: 0 },
  units: {
    kg: { factor: 1, dim: { M: 1, L: 0, T: 0, Th: 0 } },
    g: { factor: 0.001, dim: { M: 1, L: 0, T: 0, Th: 0 } },
    lb: { factor: 0.45359237, dim: { M: 1, L: 0, T: 0, Th: 0 } }
  }
},

length: {
  base: "m",
  dim: { M: 0, L: 1, T: 0, Th: 0 },
  units: {
    m: { factor: 1, dim: { M: 0, L: 1, T: 0, Th: 0 } },
    cm: { factor: 0.01, dim: { M: 0, L: 1, T: 0, Th: 0 } },
    mm: { factor: 0.001, dim: { M: 0, L: 1, T: 0, Th: 0 } },
    ft: { factor: 0.3048, dim: { M: 0, L: 1, T: 0, Th: 0 } },
    in: { factor: 0.0254, dim: { M: 0, L: 1, T: 0, Th: 0 } }
  }
},

time: {
  base: "s",
  dim: { M: 0, L: 0, T: 1, Th: 0 },
  units: {
    s: { factor: 1, dim: { M: 0, L: 0, T: 1, Th: 0 } },
    min: { factor: 60, dim: { M: 0, L: 0, T: 1, Th: 0 } },
    hr: { factor: 3600, dim: { M: 0, L: 0, T: 1, Th: 0 } }
  }
},

temperature: {
  base: "K",
  dim: { M: 0, L: 0, T: 0, Th: 1 },
  units: {
    K: { factor: 1, dim: { M: 0, L: 0, T: 0, Th: 1 } },
    C: { factor: 1, dim: { M: 0, L: 0, T: 0, Th: 1 } },
    F: { factor: 1, dim: { M: 0, L: 0, T: 0, Th: 1 } }
  }
},

area: {
  base: "m2",
  dim: { M: 0, L: 2, T: 0, Th: 0 },
  units: {
    "m2": { factor: 1, dim: { M: 0, L: 2, T: 0, Th: 0 } },
    "cm2": { factor: 0.0001, dim: { M: 0, L: 2, T: 0, Th: 0 } },
    "ft2": { factor: 0.092903, dim: { M: 0, L: 2, T: 0, Th: 0 } },
    acre: { factor: 4046.856422, dim: { M: 0, L: 2, T: 0, Th: 0 } }
  }
},

/* =========================================================
   MECHANICAL
========================================================= */

velocity: {
  base: "m/s",
  dim: { M: 0, L: 1, T: -1, Th: 0 },
  units: {
    "m/s": { factor: 1, dim: { M: 0, L: 1, T: -1, Th: 0 } },
    "km/h": { factor: 0.27777778, dim: { M: 0, L: 1, T: -1, Th: 0 } },
    "ft/s": { factor: 0.3048, dim: { M: 0, L: 1, T: -1, Th: 0 } },
    mph: { factor: 0.44704, dim: { M: 0, L: 1, T: -1, Th: 0 } }
  }
},

force: {
  base: "N",
  dim: { M: 1, L: 1, T: -2, Th: 0 },
  units: {
    N: { factor: 1, dim: { M: 1, L: 1, T: -2, Th: 0 } },
    kN: { factor: 1000, dim: { M: 1, L: 1, T: -2, Th: 0 } },
    lbf: { factor: 4.448221615, dim: { M: 1, L: 1, T: -2, Th: 0 } }
  }
},

pressure: {
  base: "Pa",
  dim: { M: 1, L: -1, T: -2, Th: 0 },
  units: {
    Pa: { factor: 1, dim: { M: 1, L: -1, T: -2, Th: 0 } },
    kPa: { factor: 1000, dim: { M: 1, L: -1, T: -2, Th: 0 } },
    MPa: { factor: 1e6, dim: { M: 1, L: -1, T: -2, Th: 0 } },
    bar: { factor: 100000, dim: { M: 1, L: -1, T: -2, Th: 0 } },
    psi: { factor: 6894.757, dim: { M: 1, L: -1, T: -2, Th: 0 } }
  }
},

energy: {
  base: "J",
  dim: { M: 1, L: 2, T: -2, Th: 0 },
  units: {
    J: { factor: 1, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    kJ: { factor: 1000, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    MJ: { factor: 1e6, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    Wh: { factor: 3600, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    kWh: { factor: 3.6e6, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    BTU: { factor: 1055.06, dim: { M: 1, L: 2, T: -2, Th: 0 } }
  }
},

power: {
  base: "W",
  dim: { M: 1, L: 2, T: -3, Th: 0 },
  units: {
    W: { factor: 1, dim: { M: 1, L: 2, T: -3, Th: 0 } },
    kW: { factor: 1000, dim: { M: 1, L: 2, T: -3, Th: 0 } },
    MW: { factor: 1e6, dim: { M: 1, L: 2, T: -3, Th: 0 } },
    hp: { factor: 745.699872, dim: { M: 1, L: 2, T: -3, Th: 0 } },
    "BTU/hr": { factor: 0.29307107, dim: { M: 1, L: 2, T: -3, Th: 0 } }
  }
},

momentum: {
  base: "kg·m/s",
  dim: { M: 1, L: 1, T: -1, Th: 0 },
  units: {
    "kg·m/s": { factor: 1, dim: { M: 1, L: 1, T: -1, Th: 0 } },
    "lb·ft/s": { factor: 1.35581795, dim: { M: 1, L: 1, T: -1, Th: 0 } }
  }
},

torque: {
  base: "N·m",
  dim: { M: 1, L: 2, T: -2, Th: 0 },
  units: {
    "N·m": { factor: 1, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    "kN·m": { factor: 1000, dim: { M: 1, L: 2, T: -2, Th: 0 } },
    "lb·ft": { factor: 1.35581795, dim: { M: 1, L: 2, T: -2, Th: 0 } }
  }
},

density: {
  base: "kg/m3",
  dim: { M: 1, L: -3, T: 0, Th: 0 },
  units: {
    "kg/m3": { factor: 1, dim: { M: 1, L: -3, T: 0, Th: 0 } },
    "g/cm3": { factor: 1000, dim: { M: 1, L: -3, T: 0, Th: 0 } },
    "lb/ft3": { factor: 16.018463, dim: { M: 1, L: -3, T: 0, Th: 0 } }
  }
},

viscosityDynamic: {
  base: "Pa·s",
  dim: { M: 1, L: -1, T: -1, Th: 0 },
  units: {
    "Pa·s": { factor: 1, dim: { M: 1, L: -1, T: -1, Th: 0 } },
    "mPa·s": { factor: 0.001, dim: { M: 1, L: -1, T: -1, Th: 0 } },
    cP: { factor: 0.001, dim: { M: 1, L: -1, T: -1, Th: 0 } },
    "lb/ft·s": { factor: 1.488164, dim: { M: 1, L: -1, T: -1, Th: 0 } }
  }
},

viscosityKinematic: {
  base: "m2/s",
  dim: { M: 0, L: 2, T: -1, Th: 0 },
  units: {
    "m2/s": { factor: 1, dim: { M: 0, L: 2, T: -1, Th: 0 } },
    St: { factor: 0.0001, dim: { M: 0, L: 2, T: -1, Th: 0 } },
    cSt: { factor: 0.000001, dim: { M: 0, L: 2, T: -1, Th: 0 } },
    "ft2/s": { factor: 0.092903, dim: { M: 0, L: 2, T: -1, Th: 0 } }
  }
},

flowRateVol: {
  base: "m3/s",
  dim: { M: 0, L: 3, T: -1, Th: 0 },
  units: {
    "m3/s": { factor: 1, dim: { M: 0, L: 3, T: -1, Th: 0 } },
    "m3/h": { factor: 1/3600, dim: { M: 0, L: 3, T: -1, Th: 0 } },
    "L/s": { factor: 0.001, dim: { M: 0, L: 3, T: -1, Th: 0 } },
    gpm: { factor: 0.0000630902, dim: { M: 0, L: 3, T: -1, Th: 0 } }
  }
},

flowRateMass: {
  base: "kg/s",
  dim: { M: 1, L: 0, T: -1, Th: 0 },
  units: {
    "kg/s": { factor: 1, dim: { M: 1, L: 0, T: -1, Th: 0 } },
    "kg/h": { factor: 1/3600, dim: { M: 1, L: 0, T: -1, Th: 0 } },
    "lb/s": { factor: 0.45359237, dim: { M: 1, L: 0, T: -1, Th: 0 } },
    "lb/h": { factor: 0.000125998, dim: { M: 1, L: 0, T: -1, Th: 0 } }
  }
},

thermalConductivity: {
  base: "W/m·K",
  dim: { M: 1, L: 1, T: -3, Th: -1 },
  units: {
    "W/m·K": { factor: 1, dim: { M: 1, L: 1, T: -3, Th: -1 } },
    "kW/m·K": { factor: 1000, dim: { M: 1, L: 1, T: -3, Th: -1 } },
    "BTU/hr·ft·°F": { factor: 1.730735, dim: { M: 1, L: 1, T: -3, Th: -1 } }
  }
},

heatTransferCoeff: {
  base: "W/m2·K",
  dim: { M: 1, L: 0, T: -3, Th: -1 },
  units: {
    "W/m2·K": { factor: 1, dim: { M: 1, L: 0, T: -3, Th: -1 } },
    "kW/m2·K": { factor: 1000, dim: { M: 1, L: 0, T: -3, Th: -1 } },
    "BTU/hr·ft2·°F": { factor: 5.678263, dim: { M: 1, L: 0, T: -3, Th: -1 } }
  }
},

specificHeat: {
  base: "J/kg·K",
  dim: { M: 0, L: 2, T: -2, Th: -1 },
  units: {
    "J/kg·K": { factor: 1, dim: { M: 0, L: 2, T: -2, Th: -1 } },
    "kJ/kg·K": { factor: 1000, dim: { M: 0, L: 2, T: -2, Th: -1 } },
    "BTU/lb·°F": { factor: 4186.8, dim: { M: 0, L: 2, T: -2, Th: -1 } }
  }
}

};
