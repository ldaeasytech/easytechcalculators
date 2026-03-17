/* =========================================================
   NAV for mobile
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     Mobile Navigation Toggle
  =============================== */

  const toggle = document.querySelector(".mobile-nav-toggle");
  const links = document.querySelector(".mobile-nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.style.display =
        links.style.display === "flex" ? "none" : "flex";
    });
  }

})