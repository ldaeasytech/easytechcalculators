import { units } from "./unitsData.js";

export function convert(quantity, value, fromUnit, toUnit) {

  if (quantity === "temperature") {
    return convertTemperature(value, fromUnit, toUnit);
  }

  const category = units[quantity];
  const from = category.units[fromUnit];
  const to = category.units[toUnit];

  const baseValue = value * from.toBase;
  const result = baseValue / to.toBase;

  return {
    baseValue,
    result,
    baseUnit: category.base,
    fromFactor: from.toBase,
    toFactor: to.toBase
  };
}

function convertTemperature(value, from, to) {

  let K;

  if (from === "C") K = value + 273.15;
  else if (from === "F") K = (value - 32) * 5/9 + 273.15;
  else K = value;

  let result;

  if (to === "C") result = K - 273.15;
  else if (to === "F") result = (K - 273.15) * 9/5 + 32;
  else result = K;

  return { result };
}
