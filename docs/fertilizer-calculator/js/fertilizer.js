// fertilizer.js

import { fertilizers } from "./fertilizerData.js";
import { fertilizerSets } from "./fertilizerOptions.js";
import { solveFertilizerSet } from "./linearSolver.js";
import { calculateCost } from "./economicRanking.js";

function getPricePerKg(pricePerBag, bagWeight) {
  const weight = bagWeight > 0 ? bagWeight : 50;
  return pricePerBag / weight;
}

// =====================================================
// CROP NUTRIENT GUIDANCE DATABASE
// =====================================================

const cropGuidance = {
 rice: { label: "Rice", N: [100,120], P: [50,60], K: [50,60] },
corn: { label: "Maize (Corn)", N: [150,180], P: [60,120], K: [60,135] },
wheat: { label: "Wheat", N: [110,140], P: [50,80], K: [40,100] },
sugarcane: { label: "Sugarcane", N: [210,250], P: [130,160], K: [100,130] },
potato: { label: "Potato", N: [150,250], P: [40,100], K: [200,300] },
vegetables: { label: "Vegetables", N: [150,200], P: [50,100], K: [150,200] },
sorghum: { label: "Sorghum", N: [60,80], P: [30,40], K: [30,40] },
cowpea: { label: "Cowpea (legume)", N: [20,60], P: [30,60], K: [40,100] }
};

// =====================================================
// DISPLAY CROP GUIDANCE
// =====================================================

const cropSelect = document.getElementById("cropType");
const guidanceBox = document.getElementById("nutrientGuidance");
const useSuggestedBtn = document.getElementById("useSuggestedBtn");

cropSelect.addEventListener("change", (e) => {

  const crop = e.target.value;
  const guide = cropGuidance[crop];

  if (!guide) {
    guidanceBox.classList.add("hidden");
    useSuggestedBtn.classList.add("hidden");
    return;
  }

  guidanceBox.innerHTML = `
  <div class="guidance-title">
    Recommended Nutrient Range – ${guide.label}
  </div>

  <div class="guidance-grid">
    <div>Nitrogen (N)</div>
    <div>${guide.N[0]} – ${guide.N[1]} kg/ha</div>

    <div>Phosphorus (P)</div>
    <div>${guide.P[0]} – ${guide.P[1]} kg/ha</div>

    <div>Potassium (K)</div>
    <div>${guide.K[0]} – ${guide.K[1]} kg/ha</div>
  </div>

  <div class="guidance-note">
    These are general agronomic ranges. Adjust based on soil test and yield goal.
  </div>
`;

  guidanceBox.classList.remove("hidden");
  useSuggestedBtn.classList.remove("hidden");

});

useSuggestedBtn.addEventListener("click", () => {

  const crop = cropSelect.value;
  const guide = cropGuidance[crop];
  if (!guide) return;

  const midpoint = (range) => (range[0] + range[1]) / 2;

  document.getElementById("targetN").value = midpoint(guide.N).toFixed(0);
  document.getElementById("targetP").value = midpoint(guide.P).toFixed(0);
  document.getElementById("targetK").value = midpoint(guide.K).toFixed(0);

});

// =====================================================
// POPULATE CROP DROPDOWN
// =====================================================

function populateCropDropdown() {

  const cropSelect = document.getElementById("cropType");

  Object.keys(cropGuidance)
  .sort((a,b) => cropGuidance[a].label.localeCompare(cropGuidance[b].label))
  .forEach(key => {

    const option = document.createElement("option");
    option.value = key;
    option.textContent = cropGuidance[key].label;

    cropSelect.appendChild(option);
  });
}

populateCropDropdown();

// =====================================================
// GENERATE PRICE INPUTS
// =====================================================
function generatePriceInputs() {

  const container = document.getElementById("priceInputs");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(fertilizers).forEach(([code, data]) => {

    const wrapper = document.createElement("div");
    wrapper.className = "price-card";

    wrapper.innerHTML = `
      <div class="price-title">
        ${data.display}
      </div>

      <div class="price-row">
        <label>Price per bag (₱)</label>
        <input 
          type="number"
          id="price_${code}"
          step="any"
          placeholder="Enter price"
        >
      </div>

      <div class="price-row">
        <label>Bag weight (kg)</label>
        <input
          type="number"
          id="bag_${code}"
          value="50"
          min="1"
          step="any"
        >
      </div>
    `;

    container.appendChild(wrapper);
  });
}

generatePriceInputs();

// =====================================================
// CALCULATE BUTTON
// =====================================================

document.getElementById("calculateBtn").addEventListener("click", () => {

const targetN = parseFloat(document.getElementById("targetN").value) || 0;
const targetP = parseFloat(document.getElementById("targetP").value) || 0;
const targetK = parseFloat(document.getElementById("targetK").value) || 0;

const soilN = parseFloat(document.getElementById("soilN").value) || 0;
const soilP = parseFloat(document.getElementById("soilP").value) || 0;
const soilK = parseFloat(document.getElementById("soilK").value) || 0;

const Nreq = Math.max(targetN - soilN, 0);
const Preq = Math.max(targetP - soilP, 0);
const Kreq = Math.max(targetK - soilK, 0);

  const required = [Nreq, Preq, Kreq];
  const results = [];

  // Check if ANY price is entered
  const anyPriceEntered = Object.keys(fertilizers).some(code => {
    const val = document.getElementById("price_" + code).value;
    return val !== "";
  });

  fertilizerSets.forEach(set => {

    const matrix = [
      [fertilizers[set[0]].N, fertilizers[set[1]].N, fertilizers[set[2]].N],
      [fertilizers[set[0]].P, fertilizers[set[1]].P, fertilizers[set[2]].P],
      [fertilizers[set[0]].K, fertilizers[set[1]].K, fertilizers[set[2]].K]
    ];

    const solution = solveFertilizerSet(matrix, required);
    if (!solution) return;

    const totalMass = solution.reduce((a,b) => a + b, 0);

    if (anyPriceEntered) {

     const pricesPerKg = set.map(code => {

  const pricePerBag =
    parseFloat(document.getElementById("price_" + code).value);

  const bagWeight =
    parseFloat(document.getElementById("bag_" + code).value) || 50;

  return getPricePerKg(pricePerBag, bagWeight);
});

      // Skip if incomplete pricing
   if (pricesPerKg.some(p => isNaN(p))) return;

    const totalCost = calculateCost(solution, pricesPerKg);

      results.push({
        set,
        solution,
        totalMass,
        totalCost
      });

    } else {

      results.push({
        set,
        solution,
        totalMass
      });

    }

  });

  if (results.length === 0) {
    alert("No feasible fertilizer combinations found.");
    return;
  }

  if (anyPriceEntered) {
    results.sort((a,b) => a.totalCost - b.totalCost);
    displayResults(results.slice(0,10), true);
  } else {
    results.sort((a,b) => a.totalMass - b.totalMass);
    displayResults(results, false);
  }

});


// =====================================================
// DISPLAY RESULTS
// =====================================================
function displayResults(results, economicMode) {

  const block = document.getElementById("resultsBlock");
  const container = document.getElementById("resultsContainer");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsSubtitle = document.getElementById("resultsSubtitle");

  container.innerHTML = "";

  // Dynamic Title
  if (economicMode) {
    resultsTitle.textContent =
      "Top 10 Most Economical Fertilizer Combinations (Lowest Cost per Hectare)";
    resultsSubtitle.textContent =
      "Ranked from lowest to highest total fertilizer cost.";
  } else {
    resultsTitle.textContent =
      "Feasible Fertilizer Combinations Ranked by Minimum Total Application Rate";
    resultsSubtitle.textContent =
      "Ranked from lowest to highest total fertilizer required.";
  }

  results.forEach((r, index) => {

   const fertilizersList = r.set.map((code, i) => {

  const kgRequired = r.solution[i];

  const bagWeight =
    parseFloat(document.getElementById("bag_" + code).value) || 50;

  const tolerance = 1e-6;

const exactBags = kgRequired / bagWeight;
const roundedBags = Math.round(exactBags);

let wholeBags;
let remainingKg;

if (Math.abs(exactBags - roundedBags) < tolerance) {
  // Exact multiple
  wholeBags = roundedBags;
  remainingKg = 0;
} else {
  wholeBags = Math.floor(exactBags);
  remainingKg = kgRequired - wholeBags * bagWeight;
}

  const amountDisplay = `
    <div class="bag-main">
      ${wholeBags} bags + ${remainingKg.toFixed(1)} kg
    </div>
    <div class="bag-total">
      (Total: ${kgRequired.toFixed(2)} kg/ha)
    </div>
  `;

  let costDisplay = "—";

  if (economicMode) {
    const pricePerBag =
      parseFloat(document.getElementById("price_" + code).value);

   const pricePerKg =
  pricePerBag && bagWeight
    ? pricePerBag / bagWeight
    : 0;

    const fertilizerCost = kgRequired * pricePerKg;

    costDisplay =
      "₱ " + fertilizerCost.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  }

  return `
    <div class="result-row">
      <div class="fert-name">
        <div class="fert-main-name">
          ${fertilizers[code].display.split(" (")[0]}
        </div>
        <div class="fert-sub-name">
          (${fertilizers[code].display.split(" (")[1]}
        </div>
      </div>
      <div class="fert-amount">
        ${amountDisplay}
      </div>
      <div class="fert-cost">
        ${costDisplay}
      </div>
    </div>
  `;
}).join("");
    
    const totalCostDisplay = economicMode
      ? `₱ ${r.totalCost.toLocaleString(undefined,{minimumFractionDigits:2})}/ha`
      : "—";

    const resultBlock = `
      <div class="structured-card">

        <div class="structured-header">
          <div class="rank-label">#${index + 1}</div>
          ${
            index === 0 && economicMode
              ? `<div class="best-badge">MOST ECONOMICAL</div>`
              : ""
          }
        </div>

        <div class="structured-table">

          <div class="structured-heading">
            <div>Fertilizer</div>
            <div>Amount</div>
            <div>Total Cost</div>
          </div>

          ${fertilizersList}

          <div class="structured-total">
            <div><strong>Total</strong></div>
            <div><strong>${r.totalMass.toFixed(2)} kg/ha</strong></div>
            <div><strong>${totalCostDisplay}</strong></div>
          </div>

        </div>

      </div>
    `;

    container.innerHTML += resultBlock;
  });

  block.classList.remove("hidden");
}
