// fertilizer.js

import { fertilizers } from "./fertilizerData.js";
import { fertilizerSets } from "./fertilizerOptions.js";
import { solveFertilizerSet } from "./linearSolver.js";
import { calculateCost } from "./economicRanking.js";


// =====================================================
// CROP NUTRIENT GUIDANCE DATABASE
// =====================================================

const cropGuidance = {
  rice: {
    label: "Rice",
    N: [120, 150],
    P: [30, 40],
    K: [100, 120]
  },
  corn: {
    label: "Corn",
    N: [140, 180],
    P: [30, 50],
    K: [100, 140]
  },
  wheat: {
    label: "Wheat",
    N: [90, 130],
    P: [20, 40],
    K: [60, 90]
  },
  vegetables: {
    label: "Vegetables (General)",
    N: [150, 200],
    P: [50, 100],
    K: [150, 200]
  },
  potato: {
    label: "Potato",
    N: [180, 220],
    P: [40, 80],
    K: [200, 240]
  }
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

  Object.entries(fertilizers).forEach(([code, data]) => {

    const wrapper = document.createElement("div");
    wrapper.className = "field";

    wrapper.innerHTML = `
  <label for="price_${code}" class="price-label">
    ${data.display}
  </label>
  <input 
    type="number"
    id="price_${code}"
    step="any"
    placeholder="Enter price per bag"
  >
  `;

    container.appendChild(wrapper);
  });
}

generatePriceInputs();


// =====================================================
// CALCULATE BUTTON
// =====================================================

document.getElementById("calculateBtn").addEventListener("click", () => {

  const Nreq = parseFloat(document.getElementById("targetN").value) || 0;
  const Preq = parseFloat(document.getElementById("targetP").value) || 0;
  const Kreq = parseFloat(document.getElementById("targetK").value) || 0;

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

      const prices = set.map(code =>
        parseFloat(document.getElementById("price_" + code).value)
      );

      // Skip if incomplete pricing
      if (prices.some(p => isNaN(p))) return;

      const totalCost = calculateCost(solution, prices);

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

  // ===============================
  // Dynamic Title
  // ===============================

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

  // ===============================
  // Determine max value for ranking bars
  // ===============================

  let maxValue;

  if (economicMode) {
    maxValue = Math.max(...results.map(r => r.totalCost));
  } else {
    maxValue = Math.max(...results.map(r => r.totalMass));
  }

  // ===============================
  // Render Results
  // ===============================

  results.forEach((r, index) => {

    const value = economicMode ? r.totalCost : r.totalMass;
    const percentWidth = (value / maxValue) * 100;

    const setNames = r.set
      .map(code => `<div>${fertilizers[code].display}</div>`)
      .join('<div class="plus-sign">+</div>');

    const costDisplay = economicMode
      ? `<div class="result-cost">₱ ${r.totalCost.toLocaleString(undefined, {minimumFractionDigits:2})}</div>`
      : "";

    const resultCard = `
      <div class="result-card ${index === 0 ? 'best-result' : ''}">
        
        <div class="result-header">
          <div class="rank-badge">#${index + 1}</div>
          ${index === 0 && economicMode ? '<div class="best-badge">MOST ECONOMICAL</div>' : ''}
        </div>

        <div class="result-combo">
          ${setNames}
        </div>

        <div class="result-values">
          <div>F1: ${r.solution[0].toFixed(2)} kg/ha</div>
          <div>F2: ${r.solution[1].toFixed(2)} kg/ha</div>
          <div>F3: ${r.solution[2].toFixed(2)} kg/ha</div>
          <div><strong>Total:</strong> ${r.totalMass.toFixed(2)} kg/ha</div>
          ${costDisplay}
        </div>

        <div class="ranking-bar-wrapper">
          <div class="ranking-bar-fill" style="width:${percentWidth}%"></div>
        </div>

      </div>
    `;

    container.innerHTML += resultCard;
  });

  block.classList.remove("hidden");
}

