export function initTooltips() {

  const tooltips = document.querySelectorAll("[data-tooltip]");

  document.addEventListener("click", e => {

    let activeTooltip = null;

    tooltips.forEach(tip => {

      if (tip.contains(e.target)) {
        activeTooltip = tip;
      } else {
        tip.classList.remove("active");
      }

    });

    if (activeTooltip) {
      activeTooltip.classList.toggle("active");
    }

  });

  document.addEventListener("keydown", e => {

    const el = document.activeElement;

    if (
      el?.dataset?.tooltip !== undefined &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      el.classList.toggle("active");
    }

  });

}
