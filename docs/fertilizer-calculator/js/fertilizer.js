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
    <div><strong>Typical Nutrient Requirement for ${guide.label}</strong></div>
    <div>Nitrogen (N): ${guide.N[0]} – ${guide.N[1]} kg/ha</div>
    <div>Phosphorus (P): ${guide.P[0]} – ${guide.P[1]} kg/ha</div>
    <div>Potassium (K): ${guide.K[0]} – ${guide.K[1]} kg/ha</div>
    <div class="guidance-note">
      These are general recommended ranges. Adjust based on soil test and yield goal.
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

  document.getElementById("targetN").value = midpoint(guide.N);
  document.getElementById("targetP").value = midpoint(guide.P);
  document.getElementById("targetK").value = midpoint(guide.K);

});

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
      <label for="price_${code}">
        ${code} – ${data.name}
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

  const container = document.getElementById("resultsContainer");
  const block = document.getElementById("resultsBlock");

  container.innerHTML = "";

  results.forEach((r, index) => {

    const setNames = r.set.map(code => fertilizers[code].display);

    const formattedCost = economicMode
      ? new Intl.NumberFormat().format(r.totalCost.toFixed(2))
      : null;

    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <div class="rank-title">#${index + 1}</div>

      <div class="fert-row">
        <div class="fert-name">${setNames[0]}</div>
        <div class="fert-amount">${r.solution[0].toFixed(2)} kg/ha</div>
      </div>

      <div class="fert-row">
        <div class="fert-name">${setNames[1]}</div>
        <div class="fert-amount">${r.solution[1].toFixed(2)} kg/ha</div>
      </div>

      <div class="fert-row">
        <div class="fert-name">${setNames[2]}</div>
        <div class="fert-amount">${r.solution[2].toFixed(2)} kg/ha</div>
      </div>

      <div class="divider"></div>

      <div class="total-row">
        <div>Total Mass</div>
        <div>${r.totalMass.toFixed(2)} kg/ha</div>
      </div>

      ${
        economicMode
          ? `
        <div class="total-row cost-row">
          <div>Total Cost</div>
          <div>₱ ${formattedCost} /ha</div>
        </div>
      `
          : ""
      }
    `;

    container.appendChild(card);
  });

  block.classList.remove("hidden");
}
