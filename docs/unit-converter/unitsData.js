export const units = {

  /* ================= BASIC ================= */

  mass: {
    base: "kg",
    units: {
      kg: { toBase: 1 },
      g: { toBase: 0.001 },
      lb: { toBase: 0.45359237 }
    }
  },

  length: {
    base: "m",
    units: {
      m: { toBase: 1 },
      cm: { toBase: 0.01 },
      mm: { toBase: 0.001 },
      ft: { toBase: 0.3048 },
      in: { toBase: 0.0254 }
    }
  },

  velocity: {
    base: "m/s",
    units: {
      "m/s": { toBase: 1 },
      "km/h": { toBase: 0.27777778 },
      "ft/s": { toBase: 0.3048 },
      mph: { toBase: 0.44704 }
    }
  },

  /* ================= MECHANICAL ================= */

  force: {
    base: "N",
    units: {
      N: { toBase: 1 },
      kN: { toBase: 1000 },
      lbf: { toBase: 4.448221615 }
    }
  },

  pressure: {
    base: "Pa",
    units: {
      Pa: { toBase: 1 },
      kPa: { toBase: 1000 },
      MPa: { toBase: 1e6 },
      bar: { toBase: 100000 },
      psi: { toBase: 6894.757 }
    }
  },

  energy: {
    base: "J",
    units: {
      J: { toBase: 1 },
      kJ: { toBase: 1000 },
      MJ: { toBase: 1e6 },
      Wh: { toBase: 3600 },
      kWh: { toBase: 3.6e6 },
      BTU: { toBase: 1055.06 }
    }
  },

  power: {
    base: "W",
    units: {
      W: { toBase: 1 },
      kW: { toBase: 1000 },
      MW: { toBase: 1e6 },
      hp: { toBase: 745.699872 },
      "BTU/hr": { toBase: 0.29307107 }
    }
  },

  momentum: {
    base: "kg·m/s",
    units: {
      "kg·m/s": { toBase: 1 },
      "lb·ft/s": { toBase: 1.35581795 }
    }
  },

  torque: {
    base: "N·m",
    units: {
      "N·m": { toBase: 1 },
      "kN·m": { toBase: 1000 },
      "lb·ft": { toBase: 1.35581795 }
    }
  },

  density: {
    base: "kg/m3",
    units: {
      "kg/m3": { toBase: 1 },
      "g/cm3": { toBase: 1000 },
      "lb/ft3": { toBase: 16.018463 }
    }
  },

  viscosityDynamic: {
    base: "Pa·s",
    units: {
      "Pa·s": { toBase: 1 },
      "mPa·s": { toBase: 0.001 },
      "cP": { toBase: 0.001 },
      "lb/ft·s": { toBase: 1.488164 }
    }
  },

  viscosityKinematic: {
    base: "m2/s",
    units: {
      "m2/s": { toBase: 1 },
      "St": { toBase: 0.0001 },
      "cSt": { toBase: 0.000001 },
      "ft2/s": { toBase: 0.092903 }
    }
  },

  flowRateVol: {
    base: "m3/s",
    units: {
      "m3/s": { toBase: 1 },
      "m3/h": { toBase: 1 / 3600 },
      "L/s": { toBase: 0.001 },
      gpm: { toBase: 0.0000630902 }
    }
  },

  flowRateMass: {
    base: "kg/s",
    units: {
      "kg/s": { toBase: 1 },
      "kg/h": { toBase: 1 / 3600 },
      "lb/s": { toBase: 0.45359237 },
      "lb/h": { toBase: 0.000125998 }
    }
  },

  /* ================= THERMAL ================= */

  thermalConductivity: {
    base: "W/m·K",
    units: {
      "W/m·K": { toBase: 1 },
      "kW/m·K": { toBase: 1000 },
      "BTU/hr·ft·°F": { toBase: 1.730735 }
    }
  },

  heatTransferCoeff: {
    base: "W/m2·K",
    units: {
      "W/m2·K": { toBase: 1 },
      "kW/m2·K": { toBase: 1000 },
      "BTU/hr·ft2·°F": { toBase: 5.678263 }
    }
  },

  specificHeat: {
    base: "J/kg·K",
    units: {
      "J/kg·K": { toBase: 1 },
      "kJ/kg·K": { toBase: 1000 },
      "BTU/lb·°F": { toBase: 4186.8 }
    }
  },

/* ================= BASIC EXTENSIONS ================= */

temperature: {
  base: "K",
  units: {
    K: { toBase: 1 },
    C: { toBase: 1 },   // handled separately
    F: { toBase: 1 }
  }
},

time: {
  base: "s",
  units: {
    s: { toBase: 1 },
    min: { toBase: 60 },
    hr: { toBase: 3600 }
  }
},

area: {
  base: "m2",
  units: {
    "m2": { toBase: 1 },
    "cm2": { toBase: 0.0001 },
    "ft2": { toBase: 0.092903 },
    acre: { toBase: 4046.856422 }
  }
},

  
};
