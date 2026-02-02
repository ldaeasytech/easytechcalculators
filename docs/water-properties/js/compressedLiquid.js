// compressedLiquid.js
// Compressed liquid via tabulated 2-step interpolation
// Async, sparse-safe, quadratic when possible

let TABLE = null;
let GRID = null;

// ------------------------------------------------------------
// Load table
// ------------------------------------------------------------
async function loadTable() {
  if (TABLE) return TABLE;

  const url = new URL("../data/compressed_liquid_table.json", import.meta.url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load compressed_liquid_table.json (${res.status})`);
  }

  TABLE = await res.json();
  return TABLE;
}

// ------------------------------------------------------------
// Normalize row (ADJUST KEYS if headers differ)
// ------------------------------------------------------------
function normalizeRow(r) {
  return {
    T:   r["Temperature\r\nK"],
    P:   r["Pressure\r\nMPa"],

    rho: r["Density\r\nkg/m^3"],
    v:   r["Volume \r\nm^3 /kg"],

    h:   r["Enthalpy\r\nkJ/kg"],
    s:   r["Entropy\r\nkJ/(kg K)"],

    cp:  r["Cp\r\nkJ/(kg K)"],
    cv:  r["Cv\r\nkJ/(kg K)"],

    k:   r["Therm. cond.\r\nW/(m K)"],
    mu:  r["Viscosity\r\nµPa s"] * 1e-6 // µPa·s → Pa·s
  };
}

// ------------------------------------------------------------
// Build pressure-sliced grid
// ------------------------------------------------------------
async function buildGrid() {
  if (GRID) return GRID;

  const raw = await loadTable();
  const rows = raw.map(normalizeRow);

  const byP = new Map();
  for (const r of rows) {
    if (!byP.has(r.P)) byP.set(r.P, []);
    byP.get(r.P).push(r);
  }

  for (const slice of byP.values()) {
    slice.sort((a, b) => a.T - b.T);
  }

  GRID = {
    P: Array.from(byP.keys()).sort((a, b) => a - b),
    slices: byP
  };

  return GRID;
}

// ------------------------------------------------------------
// Math helpers
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
// Interpolate in T (single pressure slice)
// ------------------------------------------------------------
function interpT(slice, T, key) {
  const n = slice.length;
  if (T < slice[0].T || T > slice[n - 1].T) return NaN;

  if (n >= 3) {
    if (T <= slice[1].T) {
      return quad1(
        T,
        slice[0].T, slice[1].T, slice[2].T,
        slice[0][key], slice[1][key], slice[2][key]
      );
    }

    if (T >= slice[n - 2].T) {
      return quad1(
        T,
        slice[n - 3].T, slice[n - 2].T, slice[n - 1].T,
        slice[n - 3][key], slice[n - 2][key], slice[n - 1][key]
      );
    }

    for (let i = 1; i <= n - 3; i++) {
      if (T >= slice[i].T && T <= slice[i + 1].T) {
        return quad1(
          T,
          slice[i].T, slice[i + 1].T, slice[i + 2].T,
          slice[i][key], slice[i + 1][key], slice[i + 2][key]
        );
      }
    }
  }

  // Linear fallback
  for (let i = 0; i < n - 1; i++) {
    if (T >= slice[i].T && T <= slice[i + 1].T) {
      return lerp(
        T,
        slice[i].T, slice[i + 1].T,
        slice[i][key], slice[i + 1][key]
      );
    }
  }

  return slice[0][key];
}

// ------------------------------------------------------------
// Interpolate in P
// ------------------------------------------------------------
function interpP(Pvals, vals, P) {
  const n = Pvals.length;

  if (n >= 3) {
    if (P <= Pvals[1]) {
      return quad1(P, Pvals[0], Pvals[1], Pvals[2], vals[0], vals[1], vals[2]);
    }
    if (P >= Pvals[n - 2]) {
      return quad1(
        P,
        Pvals[n - 3], Pvals[n - 2], Pvals[n - 1],
        vals[n - 3], vals[n - 2], vals[n - 1]
      );
    }
    for (let i = 1; i <= n - 3; i++) {
      if (P >= Pvals[i] && P <= Pvals[i + 1]) {
        return quad1(
          P,
          Pvals[i], Pvals[i + 1], Pvals[i + 2],
          vals[i], vals[i + 1], vals[i + 2]
        );
      }
    }
  }

  // Linear
  for (let i = 0; i < n - 1; i++) {
    if (P >= Pvals[i] && P <= Pvals[i + 1]) {
      return lerp(P, Pvals[i], Pvals[i + 1], vals[i], vals[i + 1]);
    }
  }

  return vals[0];
}

// ------------------------------------------------------------
// PUBLIC API — Compressed Liquid
// ------------------------------------------------------------
export default async function compressedLiquid(T, P) {
  const G = await buildGrid();

  if (P < G.P[0] || P > G.P[G.P.length - 1]) {
    throw new RangeError(`Compressed liquid pressure out of bounds: P=${P}`);
  }

  const keys = ["rho", "v", "h", "s", "cp", "cv", "k", "mu"];
  const out = {};

  for (const key of keys) {
    const Pvals = [];
    const vals = [];

    for (const Pk of G.P) {
      const slice = G.slices.get(Pk);
      const valT = interpT(slice, T, key);
      if (!Number.isFinite(valT)) continue;

      Pvals.push(Pk);
      vals.push(valT);
    }

    if (Pvals.length === 0) {
      throw new RangeError(`Compressed liquid: no data at T=${T} K`);
    }

    out[key] = interpP(Pvals, vals, P);
  }

  return out;
}
