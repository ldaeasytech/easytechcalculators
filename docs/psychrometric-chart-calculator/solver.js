// solver.js — Psychrometric Calculator
// Based on ASHRAE equations (SI Units)
// Default Pressure = 101.325 kPa

const P_ATM = 101.325; // kPa

/* =========================================================
   Saturation Vapor Pressure (Magnus)
   ========================================================= */
function Psat(T) {
  return 0.61078 * Math.exp((17.2694 * T) / (T + 237.3));
}

/* =========================================================
   Basic Relations
   ========================================================= */
function humidityRatio(Pv, P = P_ATM) {
  return 0.62198 * Pv / (P - Pv);
}

function vaporPressureFromW(w, P = P_ATM) {
  return (w * P) / (0.62198 + w);
}

function enthalpy(T, w) {
  return 1.006 * T + w * (2501 + 1.86 * T);
}

function specificVolume(T, w, P = P_ATM) {
  return 0.287 * (T + 273.15) * (1 + 1.607 * w) / P;
}

function dewPoint(Pv) {
  const ln = Math.log(Pv / 0.61078);
  return (237.3 * ln) / (17.2694 - ln);
}

/* =========================================================
   Wet Bulb Solver (Iterative)
   Solve: h(Tdb,w) = h(Twb, ws(Twb))
   ========================================================= */
function wetBulb(Tdb, w, P = P_ATM) {
  const h_target = enthalpy(Tdb, w);

  let Twb = Tdb - 5; // initial guess
  let error = 1;
  let iter = 0;

  while (Math.abs(error) > 0.001 && iter < 100) {
    const ws = humidityRatio(Psat(Twb), P);
    const h_wb = enthalpy(Twb, ws);
    error = h_wb - h_target;
    Twb -= error * 0.1; // damping factor
    iter++;
  }

  return Twb;
}

/* =========================================================
   Degree of Saturation
   ========================================================= */
function degreeOfSaturation(w, T, P = P_ATM) {
  const ws = humidityRatio(Psat(T), P);
  return w / ws;
}

/* =========================================================
   MAIN SOLVER
   ========================================================= */
export function solvePsychrometrics(mode, inputs) {

  const P = inputs.pressure || P_ATM;

  let Tdb, RH, w, Pv;

  /* ===================== MODE 1 ===================== */
  if (mode === "T_RH") {
    Tdb = inputs.Tdb;
    RH = inputs.RH / 100;

    Pv = RH * Psat(Tdb);
    w = humidityRatio(Pv, P);
  }

  /* ===================== MODE 2 ===================== */
  else if (mode === "T_Twb") {
    Tdb = inputs.Tdb;
    const Twb = inputs.Twb;

    const ws_wb = humidityRatio(Psat(Twb), P);
    const h_wb = enthalpy(Twb, ws_wb);

    // solve w from enthalpy equation
    w = (h_wb - 1.006 * Tdb) / (2501 + 1.86 * Tdb);

    Pv = vaporPressureFromW(w, P);
    RH = Pv / Psat(Tdb);
  }

  /* ===================== MODE 3 ===================== */
  else if (mode === "T_Tdp") {
    Tdb = inputs.Tdb;
    const Tdp = inputs.Tdp;

    Pv = Psat(Tdp);
    w = humidityRatio(Pv, P);
    RH = Pv / Psat(Tdb);
  }

  /* ===================== MODE 4 ===================== */
  else if (mode === "T_w") {
    Tdb = inputs.Tdb;
    w = inputs.w;

    Pv = vaporPressureFromW(w, P);
    RH = Pv / Psat(Tdb);
  }

  /* ===================== MODE 5 (ADVANCED) ===================== */
  else if (mode === "H_RH") {

    const h_target = inputs.h;
    RH = inputs.RH / 100;

    // Solve Tdb iteratively
    Tdb = 25; // initial guess
    let error = 1;
    let iter = 0;

    while (Math.abs(error) > 0.001 && iter < 100) {
      Pv = RH * Psat(Tdb);
      w = humidityRatio(Pv, P);
      const h_calc = enthalpy(Tdb, w);
      error = h_calc - h_target;
      Tdb -= error * 0.05;
      iter++;
    }

    Pv = RH * Psat(Tdb);
    w = humidityRatio(Pv, P);
  }

  else {
    throw new Error("Invalid mode selected.");
  }

  /* =========================================================
     Common Outputs
     ========================================================= */
  const h = enthalpy(Tdb, w);
  const v = specificVolume(Tdb, w, P);
  const Tdp = dewPoint(Pv);
  const Twb = wetBulb(Tdb, w, P);
  const mu = degreeOfSaturation(w, Tdb, P);

  return {
    dry_bulb: Tdb,
    relative_humidity: RH * 100,
    humidity_ratio: w,
    dew_point: Tdp,
    wet_bulb: Twb,
    enthalpy: h,
    specific_volume: v,
    vapor_pressure: Pv,
    degree_of_saturation: mu
  };
}
