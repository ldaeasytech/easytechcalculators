// js/fittingsHandler.js

import { FIXED_FITTINGS } from "./data/fittings.js";
import {
  gateValveK,
  diaphragmValveK,
  globeValveK,
  plugCockK,
  butterflyValveK
} from "./utils/valveLossModels.js";

const fittingSelect = document.getElementById("fittingType");
const qtyInput = document.getElementById("fittingQty");
const valveField = document.getElementById("valveInputField");
const valveLabel = document.getElementById("valveInputLabel");
const valveValue = document.getElementById("valveInputValue");
const listDiv = document.getElementById("fittingsList");

const fittings = [];

/* ===============================
   Populate dropdown
=============================== */
[
  ...Object.keys(FIXED_FITTINGS),
  "Gate valve",
  "Globe valve",
  "Diaphragm valve",
  "Plug cock",
  "Butterfly valve"
].forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  fittingSelect.appendChild(opt);
});

/* ===============================
   Dynamic valve input
=============================== */
fittingSelect.addEventListener("change", () => {
  const type = fittingSelect.value;
  valveField.style.display = "none";

  if (["Gate valve", "Globe valve", "Diaphragm valve"].includes(type)) {
    valveLabel.textContent = "Percent opening (%)";
    valveField.style.display = "block";
  }

  if (["Plug cock", "Butterfly valve"].includes(type)) {
    valveLabel.textContent = "Degrees closed (°)";
    valveField.style.display = "block";
  }
});

/* ===============================
   Add fitting
=============================== */
document.getElementById("addFitting").addEventListener("click", () => {
  const type = fittingSelect.value;
  const qty = Number(qtyInput.value);
  let K = 0;

  if (!qty || qty < 1) return;

  if (FIXED_FITTINGS[type] !== undefined) {
    K = FIXED_FITTINGS[type];
  } else {
    const val = Number(valveValue.value);
    if (isNaN(val)) return;

    switch (type) {
      case "Gate valve":      K = gateValveK(val); break;
      case "Globe valve":     K = globeValveK(val); break;
      case "Diaphragm valve": K = diaphragmValveK(val); break;
      case "Plug cock":       K = plugCockK(val); break;
      case "Butterfly valve": K = butterflyValveK(val); break;
    }
  }

  fittings.push({ type, qty, K });
  updateFittings();
});

/* ===============================
   Remove fitting
=============================== */
function removeFitting(index) {
  fittings.splice(index, 1);
  updateFittings();
}

/* ===============================
   Update display only (Styled Version)
=============================== */
function updateFittings() {

  // ✅ Always update count first
  document.getElementById("fittingsCount").textContent =
    fittings.length;

  if (fittings.length === 0) {

    listDiv.innerHTML = `
      <div class="fittings-empty">
        No fittings added
      </div>
    `;

    return;
  }

  listDiv.innerHTML = fittings.map((f, i) => `
    <div class="fitting-item">
      <span class="fitting-text">
        ${f.qty} × ${f.type} → K = ${(f.K * f.qty).toFixed(3)}
      </span>
      <span 
        class="fitting-remove"
        data-index="${i}"
        title="Remove fitting"
      >
        ×
      </span>
    </div>
  `).join("");

  listDiv.querySelectorAll(".fitting-remove").forEach(btn => {
    btn.addEventListener("click", () =>
      removeFitting(Number(btn.dataset.index))
    );
  });

}


/* ===============================
   Export total K
=============================== */
export function getTotalFittingsK() {
  return fittings.reduce(
    (sum, f) => sum + f.K * f.qty,
    0
  );
}
