export const units = {

  mass: {
    base: "kg",
    units: {
      kg: { toBase: 1 },
      g: { toBase: 0.001 },
      lb: { toBase: 0.45359237 }
    }
  },

  length: {
    base: "m",
    units: {
      m: { toBase: 1 },
      cm: { toBase: 0.01 },
      mm: { toBase: 0.001 },
      ft: { toBase: 0.3048 },
      in: { toBase: 0.0254 }
    }
  },

  pressure: {
    base: "Pa",
    units: {
      Pa: { toBase: 1 },
      kPa: { toBase: 1000 },
      MPa: { toBase: 1e6 },
      bar: { toBase: 100000 },
      psi: { toBase: 6894.757 }
    }
  },

  force: {
    base: "N",
    units: {
      N: { toBase: 1 },
      kN: { toBase: 1000 },
      lbf: { toBase: 4.448221615 }
    }
  },

  power: {
    base: "W",
    units: {
      W: { toBase: 1 },
      kW: { toBase: 1000 },
      hp: { toBase: 745.699872 },
      "BTU/hr": { toBase: 0.29307107 }
    }
  },

  flowRate: {
    base: "m3/s",
    units: {
      "m3/s": { toBase: 1 },
      "m3/h": { toBase: 1 / 3600 },
      "L/s": { toBase: 0.001 },
      gpm: { toBase: 0.0000630902 }
    }
  },

  density: {
    base: "kg/m3",
    units: {
      "kg/m3": { toBase: 1 },
      "g/cm3": { toBase: 1000 },
      "lb/ft3": { toBase: 16.018463 }
    }
  }

};
