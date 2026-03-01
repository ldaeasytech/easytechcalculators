import { units } from "./unitsData.js";
import { sameDimension } from "./dimensionEngine.js";

/* ===============================
   Temperature Conversion (Affine)
================================ */

function convertTemperature(value, fromUnit, toUnit) {

  let base; // Normalize to Kelvin

  // Step 1: Convert to Kelvin
  if (fromUnit === "K") {
    base = value;
  } else if (fromUnit === "C") {
    base = value + 273.15;
  } else if (fromUnit === "F") {
    base = (value - 32) * 5/9 + 273.15;
  } else {
    throw new Error("Unsupported temperature unit.");
  }

  let result;

  // Step 2: Convert Kelvin to target
  if (toUnit === "K") {
    result = base;
  } else if (toUnit === "C") {
    result = base - 273.15;
  } else if (toUnit === "F") {
    result = (base - 273.15) * 9/5 + 32;
  } else {
    throw new Error("Unsupported temperature unit.");
  }

  return {
    result,
    baseValue: base,
    from: units.temperature.units[fromUnit],
    to: units.temperature.units[toUnit],
    quantity: "temperature"
  };
}

/* ===============================
   General Conversion
================================ */

export function convert(quantity, value, fromUnit, toUnit) {

  if (quantity === "temperature") {
    return convertTemperature(value, fromUnit, toUnit);
  }

  const category = units[quantity];

  const from = category.units[fromUnit];
  const to = category.units[toUnit];

  if (!sameDimension(from.dim, to.dim)) {
    throw new Error("Incompatible unit dimensions.");
  }

  const baseValue = value * from.factor;
  const result = baseValue / to.factor;

  return {
    result,
    baseValue,
    from,
    to,
    quantity
  };
}
