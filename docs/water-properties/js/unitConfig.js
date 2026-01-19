// unitConfig.js
// Display + canonical unit definitions
// INTERNAL UNITS NEVER CHANGE

export const UNIT_SYSTEMS = ["SI", "Imperial"];

// Canonical property keys (used everywhere)
export const PROPERTY_KEYS = {
  temperature: "temperature",
  pressure: "pressure",
  enthalpy: "enthalpy",
  entropy: "entropy",
  density: "density",
  specificVolume: "specificVolume",
  cp: "cp",
  cv: "cv",
  viscosity: "viscosity",
  conductivity: "conductivity"
};

// Phase labels (UI + solver-safe)
export const PHASES = {
  ICE: "ice",
  SUBCOOLED: "subcooled_liquid",
  SAT_LIQ: "saturated_liquid",
  SAT_VAP: "saturated_vapor",
  SUPERHEATED: "superheated_steam"
};

// Display units only (NO conversion logic here)
export const unitSets = {
  SI: {
    temperature: { label: "Temperature", unit: "K" },
    pressure: { label: "Pressure", unit: "MPa" },
    enthalpy: { label: "Enthalpy", unit: "kJ/kg" },
    entropy: { label: "Entropy", unit: "kJ/kg·K" },
    density: { label: "Density", unit: "kg/m³" },
    specificVolume: { label: "Specific Volume", unit: "m³/kg" },
    cp: { label: "Cp", unit: "kJ/kg·K" },
    cv: { label: "Cv", unit: "kJ/kg·K" },
    viscosity: { label: "Viscosity", unit: "Pa·s" },
    conductivity: { label: "Thermal Conductivity", unit: "W/m·K" }
  },

  Imperial: {
    temperature: { label: "Temperature", unit: "°F" },
    pressure: { label: "Pressure", unit: "psia" },
    enthalpy: { label: "Enthalpy", unit: "Btu/lbm" },
    entropy: { label: "Entropy", unit: "Btu/lbm·R" },
    density: { label: "Density", unit: "lbm/ft³" },
    specificVolume: { label: "Specific Volume", unit: "ft³/lbm" },
    cp: { label: "Cp", unit: "Btu/lbm·R" },
    cv: { label: "Cv", unit: "Btu/lbm·R" },
    viscosity: { label: "Viscosity", unit: "lbm/ft·s" },
    conductivity: { label: "Thermal Conductivity", unit: "Btu/hr·ft·R" }
  }
};
