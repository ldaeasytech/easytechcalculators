// fertilizer.js

import { fertilizers } from "./fertilizerData.js";
import { fertilizerSets } from "./fertilizerOptions.js";
import { solveFertilizerSet } from "./linearSolver.js";
import { calculateCost } from "./economicRanking.js";


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

    const setNames = r.set.map(code => fertilizers[code].name);

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
