import { computeProperties } from "./main.js";
import { solveFromTwoProperties } from "./solver.js";
import { toSI, fromSI } from "./unitConverter.js";
import { unitSets } from "./unitConfig.js";
import { validateState } from "./validator.js";
import { estimateConfidence } from "./confidence.js";
import { compareToIF97 } from "./if97/compare.js";

const form = document.getElementById("calcForm");
const output = document.getElementById("output");
const loading = document.getElementById("loading");
const errors = document.getElementById("errors");
const warnings = document.getElementById("warnings");
const suggestions = document.getElementById("suggestions");
const autoFixes = document.getElementById("autoFixes");
const unitSelect = document.getElementById("unitSystem");
const phase = document.getElementById("phase");

const temp = document.getElementById("temperature");
const press = document.getElementById("pressure");
const h = document.getElementById("enthalpy");
const s = document.getElementById("entropy");
const rho = document.getElementById("density");
const v = document.getElementById("specificVolume");
const cp = document.getElementById("cp");
const cv = document.getElementById("cv");
const mu = document.getElementById("viscosity");
const k = document.getElementById("conductivity");
const quality = document.getElementById("quality");

function updateLabels(system) {
  document.getElementById("tempLabel").textContent = unitSets[system].temperature;
  document.getElementById("pressLabel").textContent = unitSets[system].pressure;
  document.getElementById("hLabel").textContent = unitSets[system].enthalpy;
  document.getElementById("sLabel").textContent = unitSets[system].entropy;
  document.getElementById("rhoLabel").textContent = unitSets[system].density;
  document.getElementById("vLabel").textContent = unitSets[system].specificVolume;
  document.getElementById("cpLabel").textContent = unitSets[system].cp;
  document.getElementById("cvLabel").textContent = unitSets[system].cv;
  document.getElementById("muLabel").textContent = unitSets[system].viscosity;
  document.getElementById("kLabel").textContent = unitSets[system].conductivity;
}

unitSelect.addEventListener("change", () => updateLabels(unitSelect.value));
updateLabels(unitSelect.value);

function renderFixButtons(fixes) {
  autoFixes.innerHTML = "";
  fixes.forEach(fix => {
    const btn = document.createElement("button");
    btn.textContent = fix.label;
    btn.onclick = () => {
      for (const key in fix.action) {
        const el = document.getElementById(key);
        if (el) el.value = fix.action[key];
      }
    };
    autoFixes.appendChild(btn);
  });
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  loading.style.display = "block";
  output.textContent = "";
  errors.textContent = "";
  warnings.textContent = "";
  suggestions.textContent = "";
  autoFixes.innerHTML = "";

  await new Promise(r => setTimeout(r, 20));

  const inputs = {
    temperature: parseFloat(temp.value),
    pressure: parseFloat(press.value),
    enthalpy: parseFloat(h.value),
    entropy: parseFloat(s.value),
    density: parseFloat(rho.value),
    specificVolume: parseFloat(v.value),
    cp: parseFloat(cp.value),
    cv: parseFloat(cv.value),
    viscosity: parseFloat(mu.value),
    conductivity: parseFloat(k.value),
    quality: parseFloat(quality.value)
  };

  const siInputs = toSI(inputs, unitSelect.value);
  let resultSI;

  if (!isNaN(siInputs.temperature) && !isNaN(siInputs.pressure)) {
    resultSI = computeProperties(
      siInputs.temperature,
      siInputs.pressure,
      phase.value || null,
      isNaN(siInputs.quality) ? null : siInputs.quality
    );
  } else {
    const targets = {};
    for (const key in siInputs) {
      if (!isNaN(siInputs[key]) && !["temperature", "pressure", "quality"].includes(key)) {
        targets[key] = siInputs[key];
      }
    }
    const solved = solveFromTwoProperties(targets, phase.value || null);
    resultSI = computeProperties(solved.T, solved.P, phase.value || null, solved.quality);
  }

  const { errors: errs, warnings: warns, suggestions: suggs, fixes } =
    validateState(
      resultSI.temperature,
      resultSI.pressure,
      resultSI,
      resultSI.phase,
      resultSI.quality ?? null
    );

  if (errs.length > 0) {
    errors.innerHTML = errs.map(e => "❌ " + e).join("<br>");
    suggestions.innerHTML = suggs.map(s => "💡 " + s).join("<br>");
    renderFixButtons(fixes);
    loading.style.display = "none";
    return;
  }

  if (warns.length > 0) {
    warnings.innerHTML = warns.map(w => "⚠️ " + w).join("<br>");
    suggestions.innerHTML = suggs.map(s => "💡 " + s).join("<br>");
    renderFixButtons(fixes);
  }

  const display = fromSI(resultSI, unitSelect.value);
  const confidence = {};
  for (const key in display) confidence[key] = estimateConfidence(key, display.phase);

  const reference = compareToIF97(
    resultSI.temperature,
    resultSI.pressure,
    {
      v: resultSI.specificVolume,
      h: resultSI.enthalpy,
      s: resultSI.entropy,
      cp: resultSI.cp,
      cv: resultSI.cv
    }
  );

  output.textContent = JSON.stringify(
    { ...display, confidence, IF97_reference: reference },
    null,
    2
  );

  loading.style.display = "none";
});

