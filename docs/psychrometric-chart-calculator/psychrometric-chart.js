const canvas = document.getElementById("psychChart");
const ctx = canvas.getContext("2d");

const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

bgCanvas.width = canvas.width;
bgCanvas.height = canvas.height;

const P = 101.325;
const T_MIN = 0;
const T_MAX = 50;
const W_MAX = 0.030;

/* =========================================================
   Thermo Functions
========================================================= */

function Psat(T) {
  return 0.61078 * Math.exp((17.2694 * T) / (T + 237.3));
}

function humidityRatio(Pv) {
  return 0.62198 * Pv / (P - Pv);
}

function enthalpy(T, w) {
  return 1.006 * T + w * (2501 + 1.86 * T);
}

function specificVolume(T, w) {
  return 0.287 * (T + 273.15) * (1 + 1.607 * w) / P;
}

/* =========================================================
   Scaling
========================================================= */

function scaleX(T) {
  return 60 + (T - T_MIN) / (T_MAX - T_MIN) * (canvas.width - 100);
}

function scaleY(w) {
  return canvas.height - 50 - (w / W_MAX) * (canvas.height - 100);
}

/* =========================================================
   Axes
========================================================= */

function drawAxes(context) {

  const left = 60;
  const bottom = canvas.height - 50;
  const right = canvas.width - 40;
  const top = 20;

  context.strokeStyle = "#555";
  context.lineWidth = 1;

  // Axis lines
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left, bottom);
  context.lineTo(right, bottom);
  context.stroke();

  context.fillStyle = "#aaa";
  context.font = "12px sans-serif";

  /* =========================
     X AXIS (Temperature °C)
  ========================= */

  for (let T = T_MIN; T <= T_MAX; T += 5) {

    const x = scaleX(T);

    // Tick
    context.beginPath();
    context.moveTo(x, bottom);
    context.lineTo(x, bottom + 6);
    context.stroke();

    // Label
    context.fillText(
      T.toString(),
      x - 10,
      bottom + 20
    );
  }

  context.fillText(
    "Dry Bulb Temperature (°C)",
    canvas.width / 2 - 90,
    canvas.height - 10
  );

  /* =========================
     Y AXIS (Humidity Ratio)
  ========================= */

  for (let w = 0; w <= W_MAX; w += 0.005) {

    const y = scaleY(w);

    // Tick
    context.beginPath();
    context.moveTo(left - 6, y);
    context.lineTo(left, y);
    context.stroke();

    // Label
    context.fillText(
      w.toFixed(3),
      5,
      y + 4
    );
  }

  // Vertical axis label
  context.save();
  context.translate(15, canvas.height / 2 + 60);
  context.rotate(-Math.PI / 2);
  context.fillText("Humidity Ratio (kg/kg dry air)", 0, 0);
  context.restore();
}

/* =========================================================
   Saturation Curve
========================================================= */

function drawSaturation(context) {

  context.strokeStyle = "#00d4ff";
  context.lineWidth = 2;
  context.beginPath();

  for (let T = T_MIN; T <= T_MAX; T += 0.5) {
    const w = humidityRatio(Psat(T));
    const x = scaleX(T);
    const y = scaleY(w);

    if (T === T_MIN) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.stroke();
}

/* =========================================================
   RH Curves
========================================================= */

function drawRH(context) {

  context.lineWidth = 1;

  for (let rh = 0.1; rh < 1.0; rh += 0.1) {

    context.strokeStyle = "rgba(200,200,200,0.35)";
    context.beginPath();

    for (let T = T_MIN; T <= T_MAX; T += 0.5) {
      const Pv = rh * Psat(T);
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
   Constant Enthalpy Lines
========================================================= */

function drawEnthalpy(context) {

  context.strokeStyle = "rgba(255,165,0,0.35)";
  context.lineWidth = 1;

  for (let hVal = 10; hVal <= 120; hVal += 10) {

    context.beginPath();

    for (let T = T_MIN; T <= T_MAX; T += 1) {
      const w = (hVal - 1.006 * T) / (2501 + 1.86 * T);
      if (w < 0) continue;

      const x = scaleX(T);
      const y = scaleY(w);

      if (T === T_MIN) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.stroke();
  }
}

/* =========================================================
   Constant Specific Volume Lines
========================================================= */

function drawSpecificVolume(context) {

  context.strokeStyle = "rgba(0,255,150,0.3)";
  context.lineWidth = 1;

  for (let vVal = 0.75; vVal <= 1.05; vVal += 0.05) {

    context.beginPath();

    for (let T = T_MIN; T <= T_MAX; T += 1) {
      const w = ((vVal * P) / (0.287 * (T + 273.15)) - 1) / 1.607;
      if (w < 0) continue;

      const x = scaleX(T);
      const y = scaleY(w);

      if (T === T_MIN) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.stroke();
  }
}

/* =========================================================
   Approx Wet-Bulb Lines (Constant h approx)
========================================================= */

function drawWetBulb(context) {

  context.strokeStyle = "rgba(255,255,255,0.2)";
  context.lineWidth = 1;

  for (let Twb = 5; Twb <= 35; Twb += 5) {

    const ws = humidityRatio(Psat(Twb));
    const hwb = enthalpy(Twb, ws);

    context.beginPath();

    for (let T = Twb; T <= T_MAX; T += 1) {
      const w = (hwb - 1.006 * T) / (2501 + 1.86 * T);
      if (w < 0) continue;

      const x = scaleX(T);
      const y = scaleY(w);

      if (T === Twb) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.stroke();
  }
}

/* =========================================================
   Pre-render Background
========================================================= */

function renderBackground() {

  bgCtx.clearRect(0, 0, canvas.width, canvas.height);

  drawAxes(bgCtx);
  drawRH(bgCtx);
  drawSaturation(bgCtx);
  drawEnthalpy(bgCtx);
  drawSpecificVolume(bgCtx);
  drawWetBulb(bgCtx);
}

renderBackground();

/* =========================================================
   Render Public Function
========================================================= */

export function renderPsychChart(state) {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(bgCanvas, 0, 0);

  if (state) {
    const x = scaleX(state.dry_bulb);
    const y = scaleY(state.humidity_ratio);

    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
  }
}
