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

function drawAxes() {
  ctx.strokeStyle = "#ffffff44";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.fillStyle = "#ccc";
  ctx.font = "14px Arial";

  ctx.fillText("Reynolds Number (Re)", width/2 - 70, height - 20);
  ctx.save();
  ctx.translate(20, height/2 + 50);
  ctx.rotate(-Math.PI/2);
  ctx.fillText("Darcy Friction Factor (f)", 0, 0);
  ctx.restore();
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

  ctx.lineWidth = 1.5;

  roughnessValues.forEach(rr => {

    ctx.strokeStyle = rr === 0 ? "#ffd166" : "#ffffff55";

    ctx.beginPath();

    for (let Re = 3000; Re <= ReMax; Re *= 1.08) {

      const D = 1; // relative scaling
      const e = rr * D;

      const f = 4*frictionFactor(Re, e, D);

      ctx.lineTo(xScale(Re), yScale(f));
    }

    ctx.stroke();
  });
}

function drawOperatingPoint(Re, f) {
  ctx.fillStyle = "#ff4d6d";

  ctx.beginPath();
  ctx.arc(xScale(Re), yScale(f), 6, 0, 2*Math.PI);
  ctx.fill();
}

export function renderMoody(Re, f) {

  ctx.clearRect(0, 0, width, height);

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
