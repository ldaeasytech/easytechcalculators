// region2.js
// Superheated steam properties via tabulated quadratic interpolation
// ASYNC + HARD-FAIL outside table bounds
//
// Units:
//   T  [K]
//   P  [MPa]
//   rho [kg/m3]
//   v   [m3/kg]
//   h   [kJ/kg]
//   s   [kJ/kg-K]
//   cp  [kJ/kg-K]
//   cv  [kJ/kg-K]
//   k   [W/m-K]
//   mu  [Pa-s]

// ------------------------------------------------------------
// Load JSON table (once, cached)
// ------------------------------------------------------------
let TABLE = null;
let GRID = null;

async function loadTable() {
  if (TABLE) return TABLE;

  const url = new URL("../data/superheated_table.json", import.meta.url);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Failed to load superheated_table.json (${res.status})`
    );
  }

  TABLE = await res.json();
  return TABLE;
}

// ------------------------------------------------------------
// Build grid once
// ------------------------------------------------------------
async function buildGrid() {
  if (GRID) return GRID;

  const rows = await loadTable();

  const Tset = new Set();
  const Pset = new Set();

  for (const r of rows) {
    Tset.add(r.T);
    Pset.add(r.P);
  }

  const T = Array.from(Tset).sort((a, b) => a - b);
  const P = Array.from(Pset).sort((a, b) => a - b);

  const Ti = new Map(T.map((v, i) => [v, i]));
  const Pi = new Map(P.map((v, i) => [v, i]));

  const NT = T.length;
  const NP = P.length;

  const alloc = () =>
    Array.from({ length: NT }, () => Array(NP).fill(NaN));

  const grid = {
    T, P,
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
// Interpolation utilities
// ------------------------------------------------------------
function bracket3(arr, x) {
  const n = arr.length;

  if (n < 3) {
    throw new Error("Quadratic interpolation requires at least 3 grid points");
  }

  if (x < arr[0] || x > arr[n - 1]) {
    throw new RangeError(
      `Region 2 out of range: value=${x}, allowed=[${arr[0]}, ${arr[n - 1]}]`
    );
  }

  // Lower boundary
  if (x <= arr[1]) {
    return [0, 1, 2];
  }

  // Upper boundary
  if (x >= arr[n - 2]) {
    return [n - 3, n - 2, n - 1];
  }

  // Interior
  for (let i = 1; i <= n - 3; i++) {
    if (x >= arr[i] && x <= arr[i + 1]) {
      return [i, i + 1, i + 2];
    }
  }

  // Absolute safety fallback (should never hit)
  return [n - 3, n - 2, n - 1];
}


// 1D quadratic Lagrange interpolation
function quad1(x, x0, x1, x2, f0, f1, f2) {
  const L0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const L1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const L2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return L0 * f0 + L1 * f1 + L2 * f2;
}

// 2D tensor-product quadratic interpolation
function quad2D(T, P, Tarr, Parr, F) {
  const [i0, i1, i2] = bracket3(Tarr, T);
  const [j0, j1, j2] = bracket3(Parr, P);

  const g0 = quad1(
    P,
    Parr[j0], Parr[j1], Parr[j2],
    F[i0][j0], F[i0][j1], F[i0][j2]
  );

  const g1 = quad1(
    P,
    Parr[j0], Parr[j1], Parr[j2],
    F[i1][j0], F[i1][j1], F[i1][j2]
  );

  const g2 = quad1(
    P,
    Parr[j0], Parr[j1], Parr[j2],
    F[i2][j0], F[i2][j1], F[i2][j2]
  );

  return quad1(
    T,
    Tarr[i0], Tarr[i1], Tarr[i2],
    g0, g1, g2
  );
}

// ------------------------------------------------------------
// PUBLIC API — Drop-in Region 2 (ASYNC)
// ------------------------------------------------------------
export default async function region2(T, P) {
  const G = await buildGrid();

  // Hard fail outside region
  if (
    T < G.T[0] || T > G.T[G.T.length - 1] ||
    P < G.P[0] || P > G.P[G.P.length - 1]
  ) {
    throw new RangeError(
      `Region 2 (superheated table) out of bounds: T=${T} K, P=${P} MPa`
    );
  }

  return {
    rho: quad2D(T, P, G.T, G.P, G.rho),
    v:   quad2D(T, P, G.T, G.P, G.v),
    h:   quad2D(T, P, G.T, G.P, G.h),
    s:   quad2D(T, P, G.T, G.P, G.s),
    cp:  quad2D(T, P, G.T, G.P, G.cp),
    cv:  quad2D(T, P, G.T, G.P, G.cv),
    k:   quad2D(T, P, G.T, G.P, G.k),
    mu:  quad2D(T, P, G.T, G.P, G.mu)
  };
}
