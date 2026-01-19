// IAPWS-IF97 Region 1 (Compressed / Subcooled Liquid)
// Valid for: 273.15 K ≤ T ≤ 623.15 K, Psat(T) ≤ P ≤ 100 MPa
//
// INTERNAL UNITS (STRICT):
//   T → K
//   P → MPa
//   R → kJ/(kg·K)
//
// Formulation: Dimensionless Gibbs free energy γ(π,τ)
// Reference: IAPWS-IF97 (2007), Section 5.1

import { R } from "./constants.js";

/* ------------------------------------------------------------
   IF97 REGION 1 COEFFICIENTS (OFFICIAL)
------------------------------------------------------------ */

const I = [
  0,0,0,0,0,0,
  1,1,1,1,1,1,
  2,2,2,2,2,
  3,3,3,
  4,4,4,
  5,
  8,8,
  21,23,29,30,31,32
];

const J = [
 -2,-1,0,1,2,3,
 -9,-7,-1,0,1,3,
 -3,0,1,3,17,
 -4,0,6,
 -5,-2,10,
 -8,
 -11,-6,
 -29,-31,-38,-39,-40,-41
];

const n = [
   0.14632971213167,
  -0.84548187169114,
  -3.7563603672040,
   3.3855169168385,
  -0.95791963387872,
   0.15772038513228,
  -0.016616417199501,
   0.00081214629983568,
   0.00028319080123804,
  -0.00060706301565874,
  -0.018990068218419,
  -0.032529748770505,
  -0.021841717175414,
  -0.00005283835796993,
  -0.00047184321073267,
  -0.00030001780793026,
   0.000047661393906987,
  -0.0000044141845330846,
  -7.2694996297594e-16,
  -3.1679644845054e-05,
  -2.8270797985312e-06,
  -8.5205128120103e-10,
  -2.2425281908000e-06,
  -6.5171222895601e-07,
  -1.4341729937924e-13,
  -4.0516996860117e-07,
  -1.2734301741641e-09,
  -1.7424871230634e-10,
  -6.8762131295531e-19,
   1.4478307828521e-20,
   2.6335781662795e-23,
  -1.1947622640071e-23
];

/* ------------------------------------------------------------
   REGION 1 SOLVER
------------------------------------------------------------ */

export function region1(T, P) {

  // Dimensionless variables (OFFICIAL)
  const pi  = P / 16.53;
  const tau = 1386 / T;

  let g = 0;
  let g_pi = 0;
  let g_tau = 0;
  let g_pipi = 0;
  let g_tautau = 0;
  let g_pitau = 0;

  for (let k = 0; k < n.length; k++) {
    const Ii = I[k];
    const Ji = J[k];

    const dpi  = 7.1 - pi;
    const dtau = tau - 1.222;

    const dpi_I  = Math.pow(dpi, Ii);
    const dtau_J = Math.pow(dtau, Ji);

    g += n[k] * dpi_I * dtau_J;

    // ∂γ / ∂π  (OFFICIAL SIGN)
    g_pi += -n[k] * Ii * Math.pow(dpi, Ii - 1) * dtau_J;

    // ∂γ / ∂τ
    g_tau +=  n[k] * Ji * dpi_I * Math.pow(dtau, Ji - 1);

    // ∂²γ / ∂π²
    g_pipi += n[k] * Ii * (Ii - 1) * Math.pow(dpi, Ii - 2) * dtau_J;

    // ∂²γ / ∂τ²
    g_tautau += n[k] * Ji * (Ji - 1) * dpi_I * Math.pow(dtau, Ji - 2);

    // ∂²γ / ∂π∂τ
    g_pitau += -n[k] * Ii * Ji *
               Math.pow(dpi, Ii - 1) *
               Math.pow(dtau, Ji - 1);
  }

  /* ------------------------------------------------------------
     THERMODYNAMIC PROPERTIES (IF97 EXACT)
  ------------------------------------------------------------ */

  // Specific volume [m³/kg]
  // v = (R T / P) · ( − ∂γ/∂π )
  const specificVolume = (R * T / P) * (-g_pi);
  const density = 1 / specificVolume;

  // Enthalpy [kJ/kg]
  const enthalpy = R * T * tau * g_tau;

  // Entropy [kJ/(kg·K)]
  const entropy = R * (tau * g_tau - g);

  // Isochoric heat capacity [kJ/(kg·K)]
  const cv = R * (
    -tau * tau * g_tautau +
    Math.pow(g_pi - tau * g_pitau, 2) / g_pipi
  );

  // Isobaric heat capacity [kJ/(kg·K)]
  const cp = -R * tau * tau * g_tautau;

  return {
    region: 1,
    phase: "subcooled liquid",
    T,
    P,
    density,
    specificVolume,
    enthalpy,
    entropy,
    cp,
    cv
  };
}
