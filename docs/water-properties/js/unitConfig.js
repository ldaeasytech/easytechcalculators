export const unitSets = {
  temperature: {
    SI: [
      { unit: "K", toSI: x => x, fromSI: x => x },
      { unit: "°C", toSI: x => x + 273.15, fromSI: x => x - 273.15 }
    ],
    Imperial: [
      { unit: "°F", toSI: x => (x + 459.67) / 1.8, fromSI: x => x * 1.8 - 459.67 },
      { unit: "°R", toSI: x => x / 1.8, fromSI: x => x * 1.8 }
    ]
  },

  pressure: {
    SI: [
      { unit: "MPa", toSI: x => x, fromSI: x => x },
      { unit: "kPa", toSI: x => x / 1000, fromSI: x => x * 1000 },
      { unit: "bar", toSI: x => x / 10, fromSI: x => x * 10 }
    ],
    Imperial: [
      { unit: "psia", toSI: x => x / 145.0377377, fromSI: x => x * 145.0377377 },
      { unit: "psi", toSI: x => x / 145.0377377, fromSI: x => x * 145.0377377 }
    ]
  },

  enthalpy: {
    SI: [
      { unit: "kJ/kg", toSI: x => x, fromSI: x => x },
      { unit: "J/kg", toSI: x => x / 1000, fromSI: x => x * 1000 }
    ],
    Imperial: [
      { unit: "Btu/lbm", toSI: x => x / 0.429922614, fromSI: x => x * 0.429922614 }
    ]
  },

  entropy: {
    SI: [
      { unit: "kJ/kg·K", toSI: x => x, fromSI: x => x }
    ],
    Imperial: [
      { unit: "Btu/lbm·R", toSI: x => x / 0.429922614, fromSI: x => x * 0.429922614 }
    ]
  },

  density: {
    SI: [
      { unit: "kg/m³", toSI: x => x, fromSI: x => x }
    ],
    Imperial: [
      { unit: "lbm/ft³", toSI: x => x / 0.06242796, fromSI: x => x * 0.06242796 }
    ]
  },

  specificVolume: {
    SI: [
      { unit: "m³/kg", toSI: x => x, fromSI: x => x }
    ],
    Imperial: [
      { unit: "ft³/lbm", toSI: x => x * 0.06242796, fromSI: x => x / 0.06242796 }
    ]
  }
};
