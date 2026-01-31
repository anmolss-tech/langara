document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const mainContent = document.getElementById("main-content");
  const body = document.body;

  const toggleMenu = () => {
    sideMenu.classList.toggle("open");
    body.classList.toggle("no-scroll");
  };
  togglingMenu();
  closingByClickOutside();
  closingByPressingEsc();

  function togglingMenu() {
    if (menuToggle && sideMenu) {
      menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMenu();
      });
    }
  }
  function closingByClickOutside() {
    document.addEventListener("click", (event) => {
      if (
        sideMenu.classList.contains("open") &&
        !sideMenu.contains(event.target)
      ) {
        toggleMenu();
      }
    });
  }
  function closingByClickOutside() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sideMenu.classList.contains("open")) {
        toggleMenu();
      }
    });
  }
});
