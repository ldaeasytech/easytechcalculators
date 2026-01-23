// unitConfig.js
// Display + canonical unit definitions

export const UNIT_SYSTEMS = ["SI", "Imperial"];

export const PROPERTY_KEYS = {
  temperature: "temperature",
  pressure: "pressure",
  enthalpy: "enthalpy",
  entropy: "entropy",
  density: "density",
  specificVolume: "specificVolume",
  Cp: "Cp",
  Cv: "Cv",
  viscosity: "viscosity",
  conductivity: "conductivity"
};

// MUST match solver outputs exactly
export const PHASES = {
  COMPRESSED: "compressed_liquid",
  SAT_LIQ: "saturated_liquid",
  SAT_VAP: "saturated_vapor",
  SUPERHEATED: "superheated_vapor",
  DENSE: "dense_fluid",
  TWO_PHASE: "two_phase"
};

export const unitSets = {
  SI: {
    temperature: { unit: "K" },
    pressure: { unit: "MPa" },
    enthalpy: { unit: "kJ/kg" },
    entropy: { unit: "kJ/kg·K" },
    density: { unit: "kg/m³" },
    specificVolume: { unit: "m³/kg" },
    Cp: { unit: "kJ/kg·K" },
    Cv: { unit: "kJ/kg·K" },
    viscosity: { unit: "Pa·s" },
    conductivity: { unit: "W/m·K" }
  },

  Imperial: {
    temperature: { unit: "°F" },
    pressure: { unit: "psia" },
    enthalpy: { unit: "Btu/lbm" },
    entropy: { unit: "Btu/lbm·R" },
    density: { unit: "lbm/ft³" },
    specificVolume: { unit: "ft³/lbm" },
    Cp: { unit: "Btu/lbm·R" },
    Cv: { unit: "Btu/lbm·R" },
    viscosity: { unit: "lbm/ft·s" },
    conductivity: { unit: "Btu/hr·ft·R" }
  }
};
