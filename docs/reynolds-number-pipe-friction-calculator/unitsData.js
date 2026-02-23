// unitsData.js

export function normalize(type, value, unit) {

  const factors = {

    density: {
      kgm3: 1,
      lbft3: 16.0185
    },

    velocity: {
      ms: 1,
      fts: 0.3048
    },

    length: {
      m: 1,
      mm: 0.001,
      ft: 0.3048,
      in: 0.0254
    },

    dynamicViscosity: {
      Pas: 1,
      cP: 0.001,
      lbfts: 1.48816
    },

    kinematicViscosity: {
      m2s: 1,
      cSt: 1e-6,
      ft2s: 0.092903
    },

    length: {
      m: 1,
      mm: 0.001,
      ft: 0.3048,
      in: 0.0254
    }

  };

  return value * factors[type][unit];
}
