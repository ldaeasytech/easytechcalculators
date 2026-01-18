import { solve } from "./solver.js";
import { getUnitConfig } from "./unitConfig.js";

/**
 * DOM elements
 */
const form = document.getElementById("calculatorForm");
const outputBox = document.getElementById("outputBox");
const errorBox = document.getElementById("errorBox");
const warningBox = document.getElementById("warningBox");
const suggestionBox = document.getElementById("suggestionBox");
const autoFixBox = document.getElementById("autoFixBox");
const unitSelect = document.getElementById("unitSystem");

/**
 * Initialize UI
 */
document.addEventListener("DOMContentLoaded", () => {
  form.addEventListener("submit", handleSubmit);
  unitSelect.addEventListener("change", handleUnitChange);
});

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  clearMessages();
  outputBox.textContent = "Calculating… Please wait.";

  const inputs = collectInputs();
  const unitSystem = unitSelect.value;

  try {
    const result = await solve(inputs, unitSystem);
    renderResults(result, unitSystem);
  } catch (err) {
    outputBox.textContent = "";
    showErrors(["Unexpected error: " + err.message]);
  }
}

/**
 * Collect user inputs from form
 */
function collectInputs() {
  const getValue = (id) => {
    const el = document.getElementById(id);
    if (!el || el.value === "") return null;
    const val = parseFloat(el.value);
    return isNaN(val) ? null : val;
  };

  return {
    temperature: getValue("temperature"),
    pressure: getValue("pressure"),
    phase: document.getElementById("phase")?.value || null,
    density: getValue("density"),
    specificVolume: getValue("specificVolume"),
    enthalpy: getValue("enthalpy"),
    entropy: getValue("entropy"),
    cp: getValue("cp"),
    cv: getValue("cv"),
    thermalConductivity: getValue("thermalConductivity"),
    viscosity: getValue("viscosity")
  };
}

/**
 * Render results to UI
 */
function renderResults(data, unitSystem) {
  clearMessages();

  if (data.status !== "ok") {
    showErrors(data.errors || []);
    showWarnings(data.warnings || []);
    showSuggestions(data.suggestions || []);
    outputBox.textContent = "";
    return;
  }

  const r = data.results;
  const units = r.units;

  const lines = [
    `Temperature: ${r.T.toFixed(3)} ${units.temperature}`,
    `Pressure: ${r.P.toFixed(3)} ${units.pressure}`,
    `Phase: ${r.phase}`,
    r.quality !== null ? `Quality (x): ${r.quality.toFixed(6)}` : null,
    "",
    `Density (ρ): ${r.density.toFixed(6)} ${units.density}`,
    `Specific Volume (v): ${r.specificVolume.toExponential(6)} ${units.specificVolume}`,
    "",
    `Enthalpy (h): ${r.enthalpy.toFixed(3)} ${units.enthalpy}`,
    `Entropy (s): ${r.entropy.toFixed(6)} ${units.entropy}`,
    `Cp: ${r.cp.toFixed(6)} ${units.cp}`,
    `Cv: ${r.cv.toFixed(6)} ${units.cv}`,
    "",
    `Viscosity (μ): ${r.viscosity.toExponential(6)} ${units.viscosity}`,
    `Thermal Conductivity (k): ${r.thermalConductivity.toFixed(6)} ${units.thermalConductivity}`,
    "",
    r.enthalpyOfVaporization !== null
      ? `Enthalpy of Vaporization (h_fg): ${r.enthalpyOfVaporization.toFixed(3)} ${units.enthalpy}`
      : `Enthalpy of Vaporization (h_fg): N/A`,
    r.enthalpyOfVaporizationNote ? `Note: ${r.enthalpyOfVaporizationNote}` : null,
    "",
    r.enthalpyOfFusion !== null
      ? `Enthalpy of Fusion (h_if): ${r.enthalpyOfFusion.toFixed(3)} ${units.enthalpy}`
      : `Enthalpy of Fusion (h_if): N/A`,
    r.enthalpyOfFusionNote ? `Note: ${r.enthalpyOfFusionNote}` : null,
    "",
    r.enthalpyOfSublimation !== null
      ? `Enthalpy of Sublimation (h_sub): ${r.enthalpyOfSublimation.toFixed(3)} ${units.enthalpy}`
      : `Enthalpy of Sublimation (h_sub): N/A`,
    r.enthalpyOfSublimationNote ? `Note: ${r.enthalpyOfSublimationNote}` : null
  ];

  outputBox.textContent = lines.filter(Boolean).join("\n");
}

/**
 * Clear UI messages
 */
function clearMessages() {
  errorBox.textContent = "";
  warningBox.textContent = "";
  suggestionBox.textContent = "";
  autoFixBox.innerHTML = "";
}

/**
 * Show errors
 */
function showErrors(errors) {
  if (!errors || errors.length === 0) return;
  errorBox.textContent = errors.join("\n");
}

/**
 * Show warnings
 */
function showWarnings(warnings) {
  if (!warnings || warnings.length === 0) return;
  warningBox.textContent = warnings.join("\n");
}

/**
 * Show suggestions + auto-fix buttons
 */
function showSuggestions(suggestions) {
  if (!suggestions || suggestions.length === 0) return;

  suggestionBox.textContent = suggestions.join("\n");

  autoFixBox.innerHTML = "";
  suggestions.forEach((s) => {
    if (s.startsWith("Set")) {
      const btn = document.createElement("button");
      btn.textContent = s;
      btn.addEventListener("click", () => applySuggestion(s));
      autoFixBox.appendChild(btn);
    }
  });
}

/**
 * Apply auto-fix suggestion
 */
function applySuggestion(suggestion) {
  if (suggestion.includes("phase = saturated")) {
    const phaseSelect = document.getElementById("phase");
    if (phaseSelect) phaseSelect.value = "saturated";
  }

  if (suggestion.includes("Clear property inputs")) {
    ["density", "specificVolume", "enthalpy", "entropy", "cp", "cv"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      }
    );
  }
}

/**
 * Handle unit system change
 */
function handleUnitChange() {
  const unitSystem = unitSelect.value;
  const units = getUnitConfig(unitSystem);

  // Update unit labels
  document.getElementById("temperatureUnit").textContent = units.temperature;
  document.getElementById("pressureUnit").textContent = units.pressure;
  document.getElementById("densityUnit").textContent = units.density;
  document.getElementById("specificVolumeUnit").textContent = units.specificVolume;
  document.getElementById("enthalpyUnit").textContent = units.enthalpy;
  document.getElementById("entropyUnit").textContent = units.entropy;
  document.getElementById("cpUnit").textContent = units.cp;
  document.getElementById("cvUnit").textContent = units.cv;
  document.getElementById("viscosityUnit").textContent = units.viscosity;
  document.getElementById("thermalConductivityUnit").textContent =
    units.thermalConductivity;
}
