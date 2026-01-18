import { Tsat } from "./regions/saturation.js";
import * as liquid from "./regions/liquid.js";
import * as vapor from "./regions/vapor.js";

export function validateState(T, P, props = {}, phase = null, quality = null) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  const fixes = [];

  const Ts = !isNaN(P) ? Tsat(P) : null;

  if (!isNaN(T) && (T < 173.15 || T > 1500)) {
    errors.push("Temperature is outside the valid range for water (173 K – 1500 K).");
    suggestions.push("Enter a temperature within 173 K to 1500 K.");
  }

  if (!isNaN(P) && (P < 611 || P > 1e9)) {
    errors.push("Pressure is outside the valid range for water (611 Pa – 1000 MPa).");
    suggestions.push("Enter a pressure between 611 Pa and 1000 MPa.");
  }

  if (!isNaN(quality) && (quality < 0 || quality > 1)) {
    errors.push("Quality must be between 0 and 1.");
    suggestions.push("Enter a quality between 0 and 1.");
  }

  if (!isNaN(props.density) && props.density <= 0) {
    errors.push("Density must be positive.");
    suggestions.push("Check density input — must be > 0.");
  }

  if (!isNaN(props.specificVolume) && props.specificVolume <= 0) {
    errors.push("Specific volume must be positive.");
    suggestions.push("Check specific volume input — must be > 0.");
  }

  if (Ts !== null && !isNaN(T)) {
    if (T < Ts && phase === "vapor") {
      errors.push("Temperature is below saturation — vapor state is impossible.");
      suggestions.push("Try setting phase to liquid or saturated.");
      fixes.push({ label: "Set phase = saturated", action: { phase: "saturated" } });
    }

    if (T > Ts && phase === "liquid") {
      errors.push("Temperature is above saturation — liquid state is impossible.");
      suggestions.push("Try setting phase to vapor or saturated.");
      fixes.push({ label: "Set phase = vapor", action: { phase: "vapor" } });
    }

    if (Math.abs(T - Ts) < 0.1 && phase && phase !== "saturated") {
      warnings.push("Temperature is near saturation, but phase is not set to saturated.");
      suggestions.push("Try setting phase to saturated.");
      fixes.push({ label: "Set phase = saturated", action: { phase: "saturated" } });
    }
  }

  if (quality !== null && phase !== "saturated") {
    warnings.push("Quality is only meaningful for saturated two-phase states.");
    suggestions.push("Try setting phase to saturated.");
    fixes.push({ label: "Set phase = saturated", action: { phase: "saturated" } });
  }

  if (!isNaN(props.enthalpy) && (props.enthalpy < -500 || props.enthalpy > 5000)) {
    warnings.push("Enthalpy is outside typical physical limits for water.");
    suggestions.push("Verify enthalpy or adjust temperature/pressure.");
  }

  if (!isNaN(props.entropy) && (props.entropy < 0 || props.entropy > 15)) {
    warnings.push("Entropy is outside typical physical limits for water.");
    suggestions.push("Verify entropy or adjust temperature/pressure.");
  }

  if (Ts !== null && !isNaN(P)) {
    const rhoL = liquid.densityLiquid(Ts);
    const rhoV = vapor.densityVapor(Ts, P);
    const vL = 1 / rhoL;
    const vV = 1 / rhoV;

    const hL = liquid.enthalpyLiquid(Ts);
    const hV = vapor.enthalpyVapor(Ts);

    const sL = liquid.entropyLiquid(Ts);
    const sV = vapor.entropyVapor(Ts, P);

    if (!isNaN(props.enthalpy) && props.enthalpy > hL && props.enthalpy < hV && phase !== "saturated") {
      warnings.push("Enthalpy lies in the two-phase region.");
      suggestions.push("Try setting phase to saturated or provide quality.");
      fixes.push({ label: "Set phase = saturated", action: { phase: "saturated" } });
    }

    if (!isNaN(props.entropy) && props.entropy > sL && props.entropy < sV && phase !== "saturated") {
      warnings.push("Entropy lies in the two-phase region.");
      suggestions.push("Try setting phase to saturated or provide quality.");
      fixes.push({ label: "Set phase = saturated", action: { phase: "saturated" } });
    }

    if (!isNaN(props.specificVolume) && props.specificVolume > vL && props.specificVolume < vV && phase !== "saturated") {
      warnings.push("Specific volume lies in the two-phase region.");
      suggestions.push("Try setting phase to saturated or provide quality.");
      fixes.push({ label: "Set phase = saturated", action: { phase: "saturated" } });
    }
  }

  return { errors, warnings, suggestions, fixes };
}

