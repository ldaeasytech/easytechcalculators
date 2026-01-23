import { Psat, Tsat } from "./if97/region4.js";

// ---- Test Psat(T) ----
console.log("=== Psat(T) tests ===");
[300, 350, 373.15, 400, 450, 500].forEach(T => {
  console.log(
    `T = ${T} K  -> Psat = ${Psat(T)} MPa`
  );
});

// ---- Test Tsat(P) ----
console.log("=== Tsat(P) tests ===");
[0.001, 0.01, 0.1, 0.5, 1, 5].forEach(P => {
  console.log(
    `P = ${P} MPa -> Tsat = ${Tsat(P)} K`
  );
});
