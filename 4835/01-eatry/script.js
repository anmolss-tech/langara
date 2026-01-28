document.addEventListener("DOMContentLoaded", function () {
  const navSelector = document.querySelector(".nav-as-toggle");
  const primaryNavSelector = document.querySelector(".nav-as-prime");

  if (navSelector && primaryNavSelector) {
    navSelector.addEventListener("click", function () {
      const isExpanded =
        navSelector.getAttribute("aria-expanded") === "true" || false;
      navSelector.setAttribute("aria-expanded", !isExpanded);
      primaryNavSelector.classList.toggle("is-as-active");
      navSelector.classList.toggle("is-as-active");
    });
  }
});
