// region1.js — Compressed liquid (table-driven)
// Exact-match → interpolate → out-of-range error

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
// Normalize row (MUST match solver keys)
// ------------------------------------------------------------
function normalizeRow(r) {
  return {
    T: r["Temperature\r\nK"],
    P: r["Pressure\r\nMPa"],

    rho: r["Density\r\nkg/m^3"],
    v:   r["Volume \r\nm^3 /kg"],
    h:   r["Enthalpy\r\nkJ/kg"],
    s:   r["Entropy\r\nkJ/(kg K)"],
    cp:  r["Cp\r\nkJ/(kg K)"],
    cv:  r["Cv\r\nkJ/(kg K)"]

        // µPa·s → Pa·s
    mu:  r["Viscosity\r\nµPa s"] * 1e-6
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
// Interpolation helpers
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

  // linear fallback
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

  for (let i = 0; i < n - 1; i++) {
    if (P >= Pvals[i] && P <= Pvals[i + 1]) {
      return lerp(P, Pvals[i], Pvals[i + 1], vals[i], vals[i + 1]);
    }
  }

  return vals[0];
}

// ------------------------------------------------------------
// PUBLIC API — Region 1
// ------------------------------------------------------------
export async function region1(T, P) {
  const G = await buildGrid();

  // ---------- 1) EXACT MATCH ----------
  const slice = G.slices.get(P);
  if (slice) {
    for (const r of slice) {
      if (r.T === T) {
        return {
          rho: r.rho,
          v: r.v,
          h: r.h,
          s: r.s,
          cp: r.cp,
          cv: r.cv
        };
      }
    }
  }

  // ---------- 2) INTERPOLATION ----------
  if (P < G.P[0] || P > G.P[G.P.length - 1]) {
    throw new RangeError(`Region 1 outside table range: P=${P} MPa`);
  }

  const keys = ["rho", "v", "h", "s", "cp", "cv"];
  const out = {};

  for (const key of keys) {
    const Pvals = [];
    const vals = [];

    for (const Pk of G.P) {
      const sl = G.slices.get(Pk);
      const vT = interpT(sl, T, key);
      if (!Number.isFinite(vT)) continue;

      Pvals.push(Pk);
      vals.push(vT);
    }

    if (Pvals.length < 2) {
      throw new RangeError(`Region 1 outside T-range at P=${P}`);
    }

    out[key] = interpP(Pvals, vals, P);
  }

  return out;
}
