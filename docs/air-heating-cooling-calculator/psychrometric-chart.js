/* =========================================================
   Psychrometric Chart (Dual Unit – Production Ready)
========================================================= */

let chartUnitSystem = "SI";
let processLine = null;
let dynamicLimits = null;

export function setChartUnitSystem(system) {
  chartUnitSystem = system;
  renderBackground();
}

/* =========================================================
   Canvas Setup
========================================================= */

const canvas = document.getElementById("psychChart");
const ctx = canvas.getContext("2d");

const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

bgCanvas.width = canvas.width;
bgCanvas.height = canvas.height;

const P = 101.325; // kPa (always SI internally)

/* =========================================================
   Chart Limits (Display Units)
========================================================= */

function getChartLimits() {

  if (dynamicLimits) return dynamicLimits;

  if (chartUnitSystem === "IP") {
    return {
      T_MIN: 32,
      T_MAX: 122,
      W_MAX: 0.030
    };
  }

  return {
    T_MIN: 0,
    T_MAX: 50,
    W_MAX: 0.030
  };
}

/* =========================================================
   Thermodynamics (SI ONLY)
========================================================= */

function Psat(T_C) {
  return 0.61078 * Math.exp((17.2694 * T_C) / (T_C + 237.3));
}

function humidityRatio(Pv) {
  return 0.62198 * Pv / (P - Pv);
}

function enthalpy(T_C, w) {
  return 1.006 * T_C + w * (2501 + 1.86 * T_C);
}

/* =========================================================
   Scaling
========================================================= */

function scaleX(T_display) {
  const { T_MIN, T_MAX } = getChartLimits();
  return 60 + (T_display - T_MIN) / (T_MAX - T_MIN) * (canvas.width - 100);
}

function scaleY(w) {
  const { W_MAX } = getChartLimits();
  return canvas.height - 50 - (w / W_MAX) * (canvas.height - 100);
}

/* =========================================================
   Axes
========================================================= */

function drawAxes(context) {

  const { T_MIN, T_MAX, W_MAX } = getChartLimits();

  const left = 60;
  const bottom = canvas.height - 50;
  const right = canvas.width - 40;
  const top = 20;

  context.strokeStyle = "#555";
  context.lineWidth = 1;

  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left, bottom);
  context.lineTo(right, bottom);
  context.stroke();

  context.fillStyle = "#aaa";
  context.font = "12px sans-serif";

  /* ===== X Axis ===== */

  const step = chartUnitSystem === "IP" ? 10 : 5;

  for (let T = T_MIN; T <= T_MAX; T += step) {
    const x = scaleX(T);

    context.beginPath();
    context.moveTo(x, bottom);
    context.lineTo(x, bottom + 6);
    context.stroke();

    context.fillText(T.toFixed(0), x - 10, bottom + 20);
  }

  const tempUnit = chartUnitSystem === "IP" ? "°F" : "°C";
  context.fillText(
    `Dry Bulb Temperature (${tempUnit})`,
    canvas.width / 2 - 90,
    canvas.height - 10
  );

  /* ===== Y Axis ===== */

  for (let w = 0; w <= W_MAX; w += 0.005) {
    const y = scaleY(w);

    context.beginPath();
    context.moveTo(left - 6, y);
    context.lineTo(left, y);
    context.stroke();

    context.fillText(w.toFixed(3), 5, y + 4);
  }

  context.save();
  context.translate(25, canvas.height / 2 + 40);
  context.rotate(-Math.PI / 2);
  context.textAlign = "center";

  const wUnit =
    chartUnitSystem === "IP"
      ? "lb/lb dry air"
      : "kg/kg dry air";

  context.fillText(`Humidity Ratio (${wUnit})`, 0, 0);
  context.restore();
}

/* =========================================================
   Curves (Thermo always SI)
========================================================= */

function drawSaturation(context) {

  const { T_MIN, T_MAX } = getChartLimits();

  context.strokeStyle = "#00d4ff";
  context.lineWidth = 2;
  context.beginPath();

  for (let T = T_MIN; T <= T_MAX; T += (chartUnitSystem === "IP" ? 1 : 0.5)) {

    const T_SI = chartUnitSystem === "IP"
      ? (T - 32) * 5/9
      : T;

    const w = humidityRatio(Psat(T_SI));

    const x = scaleX(T);
    const y = scaleY(w);

    if (T === T_MIN) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.stroke();
}

function drawRH(context) {

  const { T_MIN, T_MAX } = getChartLimits();

  context.lineWidth = 1;

  for (let rh = 0.1; rh < 1.0; rh += 0.1) {

    context.strokeStyle = "rgba(200,200,200,0.35)";
    context.beginPath();

    for (let T = T_MIN; T <= T_MAX; T += (chartUnitSystem === "IP" ? 1 : 0.5)) {

      const T_SI = chartUnitSystem === "IP"
        ? (T - 32) * 5/9
        : T;

      const Pv = rh * Psat(T_SI);
      const w = humidityRatio(Pv);

      const x = scaleX(T);
      const y = scaleY(w);

      if (T === T_MIN) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.stroke();
  }
}

/* =========================================================
   Legend
========================================================= */

function drawLegend() {

  const legendX = canvas.width - 200;
  const legendY = 30;

  ctx.font = "13px sans-serif";
  ctx.textAlign = "left";

  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.arc(legendX, legendY, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Initial State", legendX + 12, legendY + 4);

  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath();
  ctx.arc(legendX, legendY + 20, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Final State", legendX + 12, legendY + 24);
}

/* =========================================================
   Background Rendering
========================================================= */

function renderBackground() {

  bgCtx.clearRect(0, 0, canvas.width, canvas.height);

  drawAxes(bgCtx);
  drawRH(bgCtx);
  drawSaturation(bgCtx);
}

renderBackground();

/* =========================================================
   Process Line Setter
========================================================= */
const T1 = state1.dry_bulb;
const T2 = state2.dry_bulb;

const w1 = state1.humidity_ratio;
const w2 = state2.humidity_ratio;

const Tmin = Math.min(T1, T2);
const Tmax = Math.max(T1, T2);
const wMaxProcess = Math.max(w1, w2);

// Temperature margin
const Tmargin = chartUnitSystem === "IP" ? 5 : 3;

// Humidity margin (15%)
const wMargin = wMaxProcess * 0.15;

// Round temperature nicely
const T_MIN = Math.floor((Tmin - Tmargin) / 10) * 10;
const T_MAX = Math.ceil((Tmax + Tmargin) / 10) * 10;

// Round humidity nicely (to 0.005 steps)
const W_MAX =
  Math.ceil((wMaxProcess + wMargin) / 0.005) * 0.005;

dynamicLimits = {
  T_MIN,
  T_MAX,
  W_MAX
};

renderBackground();

// Add margin (5°F or 3°C)
const margin = chartUnitSystem === "IP" ? 5 : 3;

dynamicLimits = {
  T_MIN: Math.floor((Tmin - margin) / 10) * 10,
  T_MAX: Math.ceil((Tmax + margin) / 10) * 10,
  W_MAX: 0.030
};

export function setProcessLine(state1, state2) {

  if (!state1 || !state2) {
    processLine = null;
    dynamicLimits = null;
    return;
  }

 /* const T1_display = chartUnitSystem === "IP"
    ? state1.dry_bulb * 9/5 + 32
    : state1.dry_bulb;

  const T2_display = chartUnitSystem === "IP"
    ? state2.dry_bulb * 9/5 + 32
    : state2.dry_bulb;*/

   const T1_display = state1.dry_bulb;
const T2_display = state2.dry_bulb;

  processLine = {
    x1: scaleX(T1_display),
    y1: scaleY(state1.humidity_ratio),
    x2: scaleX(T2_display),
    y2: scaleY(state2.humidity_ratio)
  };
}

/* =========================================================
   Main Render
========================================================= */

export function renderPsychChart(state = null) {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgCanvas, 0, 0);

  if (processLine) {

    const { x1, y1, x2, y2 } = processLine;

    ctx.strokeStyle = "#ff4d6d";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    /* Arrow */
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const L = 12;

    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - L * Math.cos(angle - Math.PI/6),
               y2 - L * Math.sin(angle - Math.PI/6));
    ctx.lineTo(x2 - L * Math.cos(angle + Math.PI/6),
               y2 - L * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fill();

    /* Initial */
    ctx.fillStyle = "#00d4ff";
    ctx.beginPath();
    ctx.arc(x1, y1, 6, 0, 2*Math.PI);
    ctx.fill();

    /* Final */
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.arc(x2, y2, 6, 0, 2*Math.PI);
    ctx.fill();

    drawLegend();
  }
}
