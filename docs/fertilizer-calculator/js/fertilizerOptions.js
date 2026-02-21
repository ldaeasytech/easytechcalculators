// fertilizerOptions.js

import { fertilizers } from "./fertilizers.js"; // adjust path if needed

const keys = Object.keys(fertilizers);

function generateCombinations(arr, k) {
  const result = [];
  const n = arr.length;

  for (let i = 0; i < n - (k - 1); i++) {
    for (let j = i + 1; j < n - (k - 2); j++) {
      for (let l = j + 1; l < n; l++) {
        result.push([arr[i], arr[j], arr[l]]);
      }
    }
  }

  return result;
}

export const fertilizerSets = generateCombinations(keys, 3);
