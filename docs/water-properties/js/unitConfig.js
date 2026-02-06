// unitConfig.js
// Canonical unit definitions + selectable options

export const UNIT_SYSTEMS = ["SI", "Imperial"];

// Canonical solver keys
export const PROPERTY_KEYS = [
  "temperature",
  "pressure",
  "enthalpy",
  "entropy",
  "density",
  "specificVolume",
  "cp",
  "cv",
  "viscosity",
  "thermalConductivity"
];

/* ============================================================
   Unit options per property
   ============================================================ */

export const UNIT_OPTIONS = {
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
    SI: [{ unit: "kJ/kg", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "Btu/lbm", toSI: x => x / 0.429922614, fromSI: x => x * 0.429922614 }]
  },

  entropy: {
    SI: [{ unit: "kJ/(kg·K)", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "Btu/(lbm·R)", toSI: x => x / 0.429922614, fromSI: x => x * 0.429922614 }]
  },

  density: {
    SI: [{ unit: "kg/m³", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "lbm/ft³", toSI: x => x / 0.06242796, fromSI: x => x * 0.06242796 }]
  },

  specificVolume: {
    SI: [{ unit: "m³/kg", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "ft³/lbm", toSI: x => x * 0.06242796, fromSI: x => x / 0.06242796 }]
  },

  cp: {
    SI: [{ unit: "kJ/(kg·K)", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "Btu/(lbm·R)", toSI: x => x / 0.429922614, fromSI: x => x * 0.429922614 }]
  },

  cv: {
    SI: [{ unit: "kJ/(kg·K)", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "Btu/(lbm·R)", toSI: x => x / 0.429922614, fromSI: x => x * 0.429922614 }]
  },

  viscosity: {
    SI: [{ unit: "Pa·s", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "lbm/(ft·s)", toSI: x => x / 0.671968975, fromSI: x => x * 0.671968975 }]
  },

  thermalConductivity: {
    SI: [{ unit: "W/(m·K)", toSI: x => x, fromSI: x => x }],
    Imperial: [{ unit: "Btu/(hr·ft·R)", toSI: x => x / 0.577789, fromSI: x => x * 0.577789 }]
  }
};

/* ============================================================
   Default unit selections
   ============================================================ */

export const DEFAULT_UNITS = {
  SI: {
    temperature: "K",
    pressure: "MPa",
    enthalpy: "kJ/kg",
    entropy: "kJ/(kg·K)",
    density: "kg/m³",
    specificVolume: "m³/kg",
    cp: "kJ/(kg·K)",
    cv: "kJ/(kg·K)",
    viscosity: "Pa·s",
    thermalConductivity: "W/(m·K)"
  },

  Imperial: {
    temperature: "°F",
    pressure: "psia",
    enthalpy: "Btu/lbm",
    entropy: "Btu/(lbm·R)",
    density: "lbm/ft³",
    specificVolume: "ft³/lbm",
    cp: "Btu/(lbm·R)",
    cv: "Btu/(lbm·R)",
    viscosity: "lbm/(ft·s)",
    thermalConductivity: "Btu/(hr·ft·R)"
  }
};


// ------------------------------------------------------------
// BACKWARD-COMPATIBILITY EXPORT (for existing app.js)
// ------------------------------------------------------------

export const unitSets = {
  SI: Object.fromEntries(
    Object.entries(DEFAULT_UNITS.SI).map(([k, unit]) => [k, { unit }])
  ),
  Imperial: Object.fromEntries(
    Object.entries(DEFAULT_UNITS.Imperial).map(([k, unit]) => [k, { unit }])
  )
};
