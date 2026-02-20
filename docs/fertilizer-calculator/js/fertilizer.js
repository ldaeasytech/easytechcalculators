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

  const Nreq = parseFloat(document.getElementById("targetN").value) || 0;
  const Preq = parseFloat(document.getElementById("targetP").value) || 0;
  const Kreq = parseFloat(document.getElementById("targetK").value) || 0;

  const required = [Nreq, Preq, Kreq];

  const results = [];

  // Check if ANY price was entered
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

    const totalMass = solution.reduce((a,b) => a+b, 0);

    if (anyPriceEntered) {

      // Only evaluate if ALL 3 prices exist
      const prices = set.map(code =>
        parseFloat(document.getElementById("price_" + code).value)
      );

      if (prices.some(p => isNaN(p))) return;

      const totalCost = calculateCost(solution, prices);

      results.push({
        set,
        solution,
        totalCost,
        totalMass
      });

    } else {

      // Feasibility mode (no price ranking)
      results.push({
        set,
        solution,
        totalMass
      });

    }

  });

  // ==============================
// Display Results
// ==============================

function displayResults(results, economicMode) {

  const table = document.getElementById("resultsTable");
  table.innerHTML = "";

  let header = `
    <tr>
      <th>Set</th>
      <th>F1 (kg)</th>
      <th>F2 (kg)</th>
      <th>F3 (kg)</th>
      <th>Total Mass</th>
  `;

  if (economicMode) header += `<th>Total Cost</th>`;

  header += `</tr>`;

  table.innerHTML += header;

  results.forEach(r => {

    let row = `
      <tr>
        <td>${r.set.join("-")}</td>
        <td>${r.solution[0].toFixed(2)}</td>
        <td>${r.solution[1].toFixed(2)}</td>
        <td>${r.solution[2].toFixed(2)}</td>
        <td>${r.totalMass.toFixed(2)}</td>
    `;

    if (economicMode)
      row += `<td>${r.totalCost.toFixed(2)}</td>`;

    row += `</tr>`;

    table.innerHTML += row;
  });

  document.getElementById("results").classList.remove("hidden");
}
  

  // Sort results
  if (anyPriceEntered) {
    results.sort((a,b) => a.totalCost - b.totalCost);
    displayResults(results.slice(0,10), true);
  } else {
    results.sort((a,b) => a.totalMass - b.totalMass);
    displayResults(results, false);
  }

});
