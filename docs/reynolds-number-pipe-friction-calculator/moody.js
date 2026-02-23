// moody.js
// Pure JS Moody Diagram (Darcy formulation)

import { frictionFactor } from "../pump-power-calculator/js/frictionPipe.js";

const canvas = document.getElementById("moodyCanvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const padding = 70;

// Log scale limits
const ReMin = 500;
const ReMax = 1e8;

const fMin = 0.008;
const fMax = 0.1;

function log10(x) {
  return Math.log(x) / Math.LN10;
}

function xScale(Re) {
  return padding +
    (log10(Re) - log10(ReMin)) /
    (log10(ReMax) - log10(ReMin)) *
    (width - 2 * padding);
}

function yScale(f) {
  return height - padding -
    (log10(f) - log10(fMin)) /
    (log10(fMax) - log10(fMin)) *
    (height - 2 * padding);
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  const xMajor = [1e3,1e4,1e5,1e6,1e7,1e8];
  const yMajor = [0.01,0.02,0.03,0.04,0.06,0.08];

  xMajor.forEach(val => {
    ctx.beginPath();
    ctx.moveTo(xScale(val), padding);
    ctx.lineTo(xScale(val), height - padding);
    ctx.stroke();
  });

  yMajor.forEach(val => {
    ctx.beginPath();
    ctx.moveTo(padding, yScale(val));
    ctx.lineTo(width - padding, yScale(val));
    ctx.stroke();
  });
}


function drawAxes() {
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.fillStyle = "#ddd";
  ctx.font = "14px Segoe UI";

  ctx.fillText("Reynolds Number (Re)", width/2 - 80, height - 20);

  ctx.save();
  ctx.translate(22, height/2 + 50);
  ctx.rotate(-Math.PI/2);
  ctx.fillText("Darcy Friction Factor (f)", 0, 0);
  ctx.restore();

  /* Secondary Axis Title */
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "13px Segoe UI";
  ctx.fillText("Relative Roughness (ε/D)", width - padding + 10, padding - 20);
}

function drawLaminar() {
  ctx.strokeStyle = "#4ecdc4";
  ctx.lineWidth = 2;

  ctx.beginPath();

  for (let Re = ReMin; Re <= 2300; Re *= 1.05) {
    const f = 64 / Re;
    ctx.lineTo(xScale(Re), yScale(f));
  }

  ctx.stroke();
}

function drawTurbulentCurves() {

  const roughnessValues = [
    0,
    0.00001,
    0.00005,
    0.0001,
    0.0005,
    0.001,
    0.005,
    0.01,
    0.02
  ];

  ctx.lineWidth = 1.4;

  roughnessValues.forEach(rr => {

    ctx.strokeStyle = rr === 0 ? "#ffd166" : "rgba(255,255,255,0.35)";
    ctx.beginPath();

    let lastX = null;
    let lastY = null;

    for (let Re = 3000; Re <= ReMax; Re *= 1.08) {

      const D = 1;
      const e = rr * D;

      const fDarcy = 4 * frictionFactor(Re, e, D);

      const x = xScale(Re);
      const y = yScale(fDarcy);

      ctx.lineTo(x, y);

      lastX = x;
      lastY = y;
    }

    ctx.stroke();

    /* ===== Secondary Axis Label (ε/D) ===== */

    if (rr !== 0 && lastY > padding && lastY < height - padding) {

      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "11px Segoe UI";

      ctx.fillText(
        `ε/D = ${rr}`,
        width - padding + 10,
        lastY
      );
    }

  });
}

function drawOperatingPoint(Re, f) {

  const x = xScale(Re);
  const y = yScale(f);

  ctx.beginPath();
  ctx.arc(x, y, 7, 0, 2*Math.PI);
  ctx.fillStyle = "#ff4d6d";
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

export function renderMoody(Re, f) {

  ctx.clearRect(0, 0, width, height);

  drawGrid();
  drawAxes();
  drawLaminar();
  drawTurbulentCurves();

  if (Re && f) {
    drawOperatingPoint(Re, f);
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
