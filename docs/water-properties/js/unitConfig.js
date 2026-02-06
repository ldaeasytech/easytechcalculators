// unitConfig.js
// Canonical unit definitions (solver-aligned)

export const UNIT_SYSTEMS = ["SI", "Imperial"];

/* ============================================================
   Unit sets (KEYS MUST MATCH SOLVER / UI)
   ============================================================ */

export const unitSets = {
  temperature: {
    SI: [
      {
        unit: "K",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "°F",
        toSI: x => (x + 459.67) / 1.8,
        fromSI: x => x * 1.8 - 459.67
      }
    ]
  },

  pressure: {
    SI: [
      {
        unit: "MPa",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "psia",
        toSI: x => x / 145.0377377,
        fromSI: x => x * 145.0377377
      }
    ]
  },

  enthalpy: {
    SI: [
      {
        unit: "kJ/kg",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "Btu/lbm",
        toSI: x => x / 0.429922614,
        fromSI: x => x * 0.429922614
      }
    ]
  },

  entropy: {
    SI: [
      {
        unit: "kJ/(kg·K)",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "Btu/(lbm·R)",
        toSI: x => x / 0.429922614,
        fromSI: x => x * 0.429922614
      }
    ]
  },

  density: {
    SI: [
      {
        unit: "kg/m³",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "lbm/ft³",
        toSI: x => x / 0.06242796,
        fromSI: x => x * 0.06242796
      }
    ]
  },

  specificVolume: {
    SI: [
      {
        unit: "m³/kg",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "ft³/lbm",
        toSI: x => x * 0.06242796,
        fromSI: x => x / 0.06242796
      }
    ]
  },

  /* ================== FIXED PROPERTIES ================== */

  cp: {
    SI: [
      {
        unit: "kJ/(kg·K)",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "Btu/(lbm·R)",
        toSI: x => x / 0.429922614,
        fromSI: x => x * 0.429922614
      }
    ]
  },

  cv: {
    SI: [
      {
        unit: "kJ/(kg·K)",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "Btu/(lbm·R)",
        toSI: x => x / 0.429922614,
        fromSI: x => x * 0.429922614
      }
    ]
  },

  viscosity: {
    SI: [
      {
        unit: "Pa·s",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "lbm/(ft·s)",
        toSI: x => x * 47.880258,     // lbm/ft·s → Pa·s
        fromSI: x => x / 47.880258
      }
    ]
  },

  thermalConductivity: {
    SI: [
      {
        unit: "W/(m·K)",
        toSI: x => x,
        fromSI: x => x
      }
    ],
    Imperial: [
      {
        unit: "Btu/(hr·ft·R)",
        toSI: x => x * 1.730735,
        fromSI: x => x / 1.730735
      }
    ]
  }
};
