import { fertilizers } from "./fertilizerData.js";
import { fertilizerSets } from "./fertilizerOptions.js";
import { solveFertilizerSet } from "./linearSolver.js";
import { calculateCost } from "./economicRanking.js";

// ==============================
// Generate Fertilizer Price Inputs
// ==============================

function generatePriceInputs() {

  const container = document.getElementById("priceInputs");

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

// Run on page load
generatePriceInputs();

document.getElementById("calculateBtn").addEventListener("click", () => {

  const Nreq = parseFloat(document.getElementById("nitrogen").value);
  const Preq = parseFloat(document.getElementById("phosphorus").value);
  const Kreq = parseFloat(document.getElementById("potassium").value);

  const required = [Nreq, Preq, Kreq];
  const results = [];

  fertilizerSets.forEach(set => {

    const prices = set.map(code =>
      parseFloat(document.getElementById("price_" + code).value)
    );

    if (prices.some(p => isNaN(p))) return;

    const matrix = [
      [fertilizers[set[0]].N, fertilizers[set[1]].N, fertilizers[set[2]].N],
      [fertilizers[set[0]].P, fertilizers[set[1]].P, fertilizers[set[2]].P],
      [fertilizers[set[0]].K, fertilizers[set[1]].K, fertilizers[set[2]].K]
    ];

    const solution = solveFertilizerSet(matrix, required);
    if (!solution) return;

    const totalCost = calculateCost(solution, prices);

    results.push({
      set,
      solution,
      totalCost
    });
  });

  results.sort((a,b) => a.totalCost - b.totalCost);

  displayResults(results.slice(0,10));
});
