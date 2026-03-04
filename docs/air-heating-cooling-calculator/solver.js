// solver.js — Psychrometric Calculator
// Based on ASHRAE equations (SI Units)
// Default Pressure = 101.325 kPa

const P_ATM = 101.325; // kPa

/* =========================================================
   Saturation Vapor Pressure (Magnus)
   ========================================================= 
function Psat(T) {
  return 0.61078 * Math.exp((17.2694 * T) / (T + 237.3));
}*/



/* =========================================================
   SONNTAG SATURATION VAPOR PRESSURE (1990)
   Input:  T_C (°C)
   Output: Psat (Pa)
========================================================= */

export function Psat(T_C) {

  const T = T_C + 273.15; // convert to Kelvin
  let ln_ps;

  if (T >= 273.15) {
    // Over liquid water
    ln_ps =
      -6096.9385 / T
      + 21.2409642
      - 2.711193e-2 * T
      + 1.673952e-5 * T * T
      + 2.433502 * Math.log(T);

  } else {
    // Over ice
    ln_ps =
      -6024.5282 / T
      + 29.32707
      + 1.0613868e-2 * T
      - 1.3198825e-5 * T * T
      - 0.49382577 * Math.log(T);
  }

  return Math.exp(ln_ps)/1000; // Pa
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



/*
function dewPoint(Pv) {
  const ln = Math.log(Pv / 0.61078);
  return (237.3 * ln) / (17.2694 - ln);
}*/

/* =========================================================
   Dew Point from Vapor Pressure
   Sonntag-consistent Newton iteration
   Input: Pv (kPa)
   Output: Tdp (°C)
========================================================= */

function dewPoint(Pv_kPa) {

  if (Pv_kPa <= 0) return -50; // safety

  const Pv = Pv_kPa; // already in kPa

  // Initial guess using Magnus (good starting point)
  let T = 10; 

  for (let i = 0; i < 200; i++) {

    const Ps = Psat(T);          // kPa
    const f = Ps - Pv;

    if (Math.abs(f) < 1e-6)
      break;

    // Numerical derivative dPs/dT
    const dT = 0.01;
    const dPs =
      (Psat(T + dT) - Psat(T - dT)) / (2 * dT);

    T = T - f / dPs;
  }

  return T;
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


/* =========================================================
   HEATING & COOLING PROCESS SOLVER
   Reuses solvePsychrometrics()
========================================================= */

export function solveHeatingCoolingProcess({
  initialMode,
  finalMode,
  initialInputs,
  finalInputs,
  pressure
}) {

  const P = pressure || P_ATM;

  /* ---------------------------
     1️⃣ Solve Initial State
  --------------------------- */

  const s1 = solvePsychrometrics(initialMode, {
    ...initialInputs,
    pressure: P
  });

  const T1 = s1.dry_bulb;
  const w1 = s1.humidity_ratio;

  let s2;
  let processType = "";
  let moistureCondensed = 0;

  /* --------------------------------------------------
     2️⃣ Standard Heating/Cooling Mode (T_only)
  -------------------------------------------------- */

  if (finalMode === "T_only") {

    const T2 = finalInputs.Tdb;

    const w_sat2 = humidityRatio(Psat(T2), P);

    let w2;

    if (w1 <= w_sat2) {

      // Sensible process only
      w2 = w1;

      processType = T2 > T1
        ? "Sensible Heating"
        : "Sensible Cooling";

    } else {

      // Cooling with condensation
      w2 = w_sat2;
      moistureCondensed = w1 - w2;

      processType = "Cooling with Dehumidification";
    }

    s2 = solvePsychrometrics("T_w", {
      Tdb: T2,
      w: w2,
      pressure: P
    });

  }

  /* --------------------------------------------------
     3️⃣ Advanced Final Modes
  -------------------------------------------------- */

  else {

    s2 = solvePsychrometrics(finalMode, {
      ...finalInputs,
      pressure: P
    });

    const T2 = s2.dry_bulb;
    const w2 = s2.humidity_ratio;

    const dT = T2 - T1;
    const dw = w2 - w1;

    const tol = 1e-6;

    /* ---------------------------
       Process Classification
    --------------------------- */

    if (Math.abs(dw) < tol) {

      processType =
        dT > 0
          ? "Sensible Heating"
          : "Sensible Cooling";

    }
    else if (dT < 0 && dw < 0) {

      processType = "Cooling with Dehumidification";
      moistureCondensed = w1 - w2;

    }
    else if (dw > 0) {

      processType = "Humidification";

    }
    else {

      processType = "General Psychrometric Process";

    }
  }
/* ---------------------------
   4️⃣ Energy Calculations
--------------------------- */

// Total heat = enthalpy change
const totalHeat = s2.enthalpy - s1.enthalpy;

// Moist air sensible heat capacity
const w_avg =
  (s1.humidity_ratio + s2.humidity_ratio) / 2;

const sensibleHeat =
  (1.006 + 1.86 * w_avg) *
  (s2.dry_bulb - s1.dry_bulb);

// Latent heat
const latentHeat = totalHeat - sensibleHeat;

  return {
  state1: s1,
  state2: s2,
  processType,
  totalHeat,
  sensibleHeat,
  latentHeat,
  moistureCondensed
};
}
