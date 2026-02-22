import { units } from "./unitsData.js";
import { sameDimension } from "./dimensionEngine.js";

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
