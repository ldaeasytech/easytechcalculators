let inputMode = "TP";

const tabHelpText = {
  TP: "Enter Temperature and Pressure (most common case).",
  Ph: "Enter Pressure and Enthalpy (energy balance).",
  Ps: "Enter Pressure and Entropy (turbines, compressors).",
  Tx: "Enter Temperature and Quality for saturated mixtures."
};

document.querySelectorAll(".input-tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    setInputMode(tab.dataset.mode);
  });
});

function setInputMode(mode) {
  inputMode = mode;
  document.getElementById("tabHelp").textContent = tabHelpText[mode];

  const all = ["temperature","pressure","enthalpy","entropy","specificVolume","quality"];
  const enabled = {
    TP:["temperature","pressure"],
    Ph:["pressure","enthalpy"],
    Ps:["pressure","entropy"],
    Tx:["temperature","quality"]
  };

  all.forEach(id => {
    const el = document.getElementById(id);
    if (!enabled[mode].includes(id)) {
      el.value = "";
      el.disabled = true;
    } else {
      el.disabled = false;
    }
  });
}

setInputMode("TP");
