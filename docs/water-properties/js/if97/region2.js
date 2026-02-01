// region2.js
// Superheated steam properties via adaptive tabulated interpolation
// ASYNC + HARD-FAIL only outside table bounds

let TABLE = null;
let GRID = null;

// ------------------------------------------------------------
// Load JSON table (once, cached)
// ------------------------------------------------------------
async function loadTable() {
  if (TABLE) return TABLE;

  const url = new URL("../data/superheated_table.json", import.meta.url);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to load superheated_table.json (${res.status})`);
  }

  TABLE = await res.json();
  return TABLE;
}

// ------------------------------------------------------------
// Build structured grid
// ------------------------------------------------------------
async function buildGrid() {
  if (GRID) return GRID;

  const rows = await loadTable();

  const Tvals = [...new Set(rows.map(r => r.T))].sort((a, b) => a - b);
  const Pvals = [...new Set(rows.map(r => r.P))].sort((a, b) => a - b);

  const Ti = new Map(Tvals.map((v, i) => [v, i]));
  const Pi = new Map(Pvals.map((v, i) => [v, i]));

  const NT = Tvals.length;
  const NP = Pvals.length;

  const alloc = () =>
    Array.from({ length: NT }, () => Array(NP).fill(NaN));

  const grid = {
    T: Tvals,
    P: Pvals,
    rho: alloc(),
    v:   alloc(),
    h:   alloc(),
    s:   alloc(),
    cp:  alloc(),
    cv:  alloc(),
    k:   alloc(),
    mu:  alloc()
  };

  for (const r of rows) {
    const i = Ti.get(r.T);
    const j = Pi.get(r.P);

    grid.rho[i][j] = r.rho;
    grid.v[i][j]   = r.v;
    grid.h[i][j]   = r.h;
    grid.s[i][j]   = r.s;
    grid.cp[i][j]  = r.cp;
    grid.cv[i][j]  = r.cv;
    grid.k[i][j]   = r.k;
    grid.mu[i][j]  = r.mu;
  }

  GRID = grid;
  return grid;
}

// ------------------------------------------------------------
// Index helpers (NO throwing here)
// ------------------------------------------------------------
function bracket2(arr, x) {
  if (arr.length < 2) return null;

  if (x <= arr[0]) return [0, 1];
  if (x >= arr[arr.length - 1]) {
    const n = arr.length;
    return [n - 2, n - 1];
  }

  for (let i = 0; i < arr.length - 1; i++) {
    if (x >= arr[i] && x <= arr[i + 1]) {
      return [i, i + 1];
    }
  }
  return null;
}

function bracket3(arr, x) {
  if (arr.length < 3) return null;

  if (x <= arr[1]) return [0, 1, 2];
  if (x >= arr[arr.length - 2]) {
    const n = arr.length;
    return [n - 3, n - 2, n - 1];
  }

  for (let i = 1; i <= arr.length - 3; i++) {
    if (x >= arr[i] && x <= arr[i + 1]) {
      return [i, i + 1, i + 2];
    }
  }
  return null;
}

// ------------------------------------------------------------
// Interpolation kernels
// ------------------------------------------------------------
function lerp(x, x0, x1, f0, f1) {
  return f0 + (f1 - f0) * (x - x0) / (x1 - x0);
}

function quad1(x, x0, x1, x2, f0, f1, f2) {
  const L0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const L1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const L2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return L0 * f0 + L1 * f1 + L2 * f2;
}

// ------------------------------------------------------------
// Adaptive 2D interpolation
// ------------------------------------------------------------
function interp2D(T, P, Tarr, Parr, F) {
  const Ti3 = bracket3(Tarr, T);
  const Pi3 = bracket3(Parr, P);

  // --- Full quadratic ---
  if (Ti3 && Pi3) {
    const [i0, i1, i2] = Ti3;
    const [j0, j1, j2] = Pi3;

    const g0 = quad1(P, Parr[j0], Parr[j1], Parr[j2],
      F[i0][j0], F[i0][j1], F[i0][j2]);

    const g1 = quad1(P, Parr[j0], Parr[j1], Parr[j2],
      F[i1][j0], F[i1][j1], F[i1][j2]);

    const g2 = quad1(P, Parr[j0], Parr[j1], Parr[j2],
      F[i2][j0], F[i2][j1], F[i2][j2]);

    return quad1(T, Tarr[i0], Tarr[i1], Tarr[i2], g0, g1, g2);
  }

  const Ti2 = bracket2(Tarr, T);
  const Pi2 = bracket2(Parr, P);

  // --- Bilinear ---
  if (Ti2 && Pi2) {
    const [i0, i1] = Ti2;
    const [j0, j1] = Pi2;

    const f00 = F[i0][j0];
    const f01 = F[i0][j1];
    const f10 = F[i1][j0];
    const f11 = F[i1][j1];

    const f0 = lerp(P, Parr[j0], Parr[j1], f00, f01);
    const f1 = lerp(P, Parr[j0], Parr[j1], f10, f11);

    return lerp(T, Tarr[i0], Tarr[i1], f0, f1);
  }

  // --- Linear in T only ---
  if (Ti2 && Parr.length === 1) {
    const [i0, i1] = Ti2;
    return lerp(T, Tarr[i0], Tarr[i1], F[i0][0], F[i1][0]);
  }

  // --- Linear in P only ---
  if (Pi2 && Tarr.length === 1) {
    const [j0, j1] = Pi2;
    return lerp(P, Parr[j0], Parr[j1], F[0][j0], F[0][j1]);
  }

  // --- Single point ---
  return F[0][0];
}

// ------------------------------------------------------------
// PUBLIC API — Region 2
// ------------------------------------------------------------
export default async function region2(T, P) {
  const G = await buildGrid();

  if (
    T < G.T[0] || T > G.T[G.T.length - 1] ||
    P < G.P[0] || P > G.P[G.P.length - 1]
  ) {
    throw new RangeError(
      `Region 2 (superheated table) out of bounds: T=${T} K, P=${P} MPa`
    );
  }

  return {
    rho: interp2D(T, P, G.T, G.P, G.rho),
    v:   interp2D(T, P, G.T, G.P, G.v),
    h:   interp2D(T, P, G.T, G.P, G.h),
    s:   interp2D(T, P, G.T, G.P, G.s),
    cp:  interp2D(T, P, G.T, G.P, G.cp),
    cv:  interp2D(T, P, G.T, G.P, G.cv),
    k:   interp2D(T, P, G.T, G.P, G.k),
    mu:  interp2D(T, P, G.T, G.P, G.mu)
  };
}
