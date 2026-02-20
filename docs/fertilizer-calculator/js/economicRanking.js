// economicRanking.js

export function calculateCost(amounts, prices) {
  return amounts.reduce((sum, amt, i) =>
    sum + amt * prices[i], 0);
}
