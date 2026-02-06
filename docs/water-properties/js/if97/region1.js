// region1.js — Compressed liquid (table-driven)
// Exact-match → interpolate → out-of-range error
// OUTPUT KEYS MATCH region2.js EXACTLY

console.log("REGION 1 MODULE LOADED");

let TABLE = null;
let GRID = null;

// ------------------------------------------------------------
// Load table (singleton, async-safe)
// ------------------------------------------------------------
async function loadTable() {
  if (TABLE) return TABLE;

  const url = new URL("../data/compressed_liquid_table.json", import.meta.url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load compressed_liquid_table.json (${res.status})`);
  }

  TABLE = await res.json();

  console.log("R1 table rows:", TABLE.length);
  console.log("R1 sample row:", TABLE[0]);

  return TABLE;
}

// ------------------------------------------------------------
// Normalize row (solver-canonical keys)
// ------------------------------------------------------------
function normalizeRow(r) {
  return {
    T:   Number(r["Temperature\r\nK"]),
    P:   Number(r["Pressure\r\nMPa"]),

    rho: Number(r["Density\r\nkg/m^3"]),
    v:   Number(r["Volume\r\nm^3 /kg"]),

    h:   Number(r["Enthalpy\r\nkJ/kg"]),
    s:   Number(r["Entropy\r\nkJ/(kg K)"]),

    cp:  Number(r["Cp\r\nkJ/(kg K)"]),
    cv:  Number(r["Cv\r\nkJ/(kg K)"]),

    k:   Number(r["Therm. cond.\r\nW/(m K)"]),

    //viscosity already in Pa·s
    mu:  Number(r["Viscosity\r\nµPa s"])
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

  // BELOW table → clamp to lowest T
  if (T <= slice[0].T) {
    return slice[0][key];
  }

  // ABOVE table → clamp to highest T
  if (T >= slice[n - 1].T) {
    return slice[n - 1][key];
  }

  // Quadratic interpolation
  if (n >= 3) {
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

  // Safety fallback
  return slice[n - 1][key];
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
  T = Number(T);
  P = Number(P);

  console.log("REGION 1 CALLED", T, P);

  const G = await buildGrid();

  // ---------- 1) EXACT MATCH ----------
  let slice = null;
  for (const Pk of G.P) {
    if (Math.abs(Pk - P) < 1e-9) {
      slice = G.slices.get(Pk);
      break;
    }
  }

  if (slice) {
    for (const r of slice) {
      if (Math.abs(r.T - T) < 1e-9) {
        return {
          rho: r.rho,
          v:   r.v,
          h:   r.h,
          s:   r.s,
          cp:  r.cp,
          cv:  r.cv,
          k:   r.k,
          mu:  r.mu
        };
      }
    }
  }

  // ---------- 2) INTERPOLATION ----------
  if (P < G.P[0] || P > G.P[G.P.length - 1]) {
    throw new RangeError(`Region 1 outside table range: P=${P} MPa`);
  }

  const keys = ["rho", "v", "h", "s", "cp", "cv", "k", "mu"];
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
