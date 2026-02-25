// js/uiInit.js

import { PIPE_ID } from "./data/pipeInnerDiameter.js";
import { PIPE_ROUGHNESS } from "./data/pipeRoughness.js";

/* ===============================
   PIPE SIZE (NPS)
=============================== */
const npsSelect = document.getElementById("pipeNPS");
const scheduleSelect = document.getElementById("pipeSchedule");

Object.keys(PIPE_ID).forEach(nps => {
  const opt = document.createElement("option");
  opt.value = nps;
  opt.textContent = nps;
  npsSelect.appendChild(opt);
});

/* ===============================
   PIPE SCHEDULE (depends on NPS)
=============================== */
function updateSchedules() {
  scheduleSelect.innerHTML = "";

  const nps = npsSelect.value;
  const schedules = Object.keys(PIPE_ID[nps]);

  schedules.forEach(sch => {
    const opt = document.createElement("option");
    opt.value = sch;
    opt.textContent = sch;
    scheduleSelect.appendChild(opt);
  });
}

npsSelect.addEventListener("change", updateSchedules);
updateSchedules();

/* ===============================
   PIPE MATERIAL
=============================== */
const materialSelect = document.getElementById("pipeMaterial");

Object.keys(PIPE_ROUGHNESS).forEach(mat => {
  const opt = document.createElement("option");
  opt.value = mat;
  opt.textContent = mat;
  materialSelect.appendChild(opt);
});
