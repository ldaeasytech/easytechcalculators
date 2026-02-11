export function getFlowInSI() {

  const value =
    Number(document.getElementById("flowValue").value);

  const unit =
    document.getElementById("flowUnit").value;

  if (!value) return 0;

  // MASS FLOW → return kg/s
  if (currentFlowType === "mass") {
    switch (unit) {
      case "kg_s": return value;
      case "kg_min": return value / 60;
      case "kg_h": return value / 3600;
      case "lb_s": return value * 0.453592;
      case "lb_min": return value * 0.453592 / 60;
      case "lb_h": return value * 0.453592 / 3600;
    }
  }

  // VOLUMETRIC FLOW → return m³/s
  else {
    switch (unit) {
      case "m3_s": return value;
      case "m3_h": return value / 3600;
      case "L_s": return value / 1000;
      case "L_min": return value / 1000 / 60;
      case "ft3_s": return value * 0.0283168;
      case "ft3_min": return value * 0.0283168 / 60;
      case "gpm": return value * 0.00006309;
    }
  }

  return 0;
}
