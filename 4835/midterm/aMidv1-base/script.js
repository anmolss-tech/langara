document.addEventListener("DOMContentLoaded", () => {
  /**
   * Toggles the navigation menu on mobile devices.
   * It adds/removes the 'nav-open' class to the sidebar,
   * which is used by CSS to show/hide the menu.
   */
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.querySelector(".sidebar");

  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener("click", () => {
      // Check if the internal sections are hidden. If so, show them when opening the main nav.
      const mainNav = document.getElementById("mainNav");
      if (
        !sidebar.classList.contains("nav-open") &&
        mainNav.classList.contains("sections-hidden")
      ) {
        mainNav.classList.remove("sections-hidden");
        updateSectionToggleButtonText(false);
      }
      sidebar.classList.toggle("nav-open");
    });
  }

  /**
   * Toggles the visibility of the four menu sections within the sidebar.
   * This works on both mobile (when the nav is open) and desktop.
   * It adds/removes the 'sections-hidden' class to the nav element.
   */
  const menuSectionsToggle = document.getElementById("menuSectionsToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuSectionsToggle && mainNav) {
    menuSectionsToggle.addEventListener("click", () => {
      const isHidden = mainNav.classList.toggle("sections-hidden");
      updateSectionToggleButtonText(isHidden);
    });
  }

  /**
   * Helper function to update the text of the section toggle button
   * for better user experience.
   * @param {boolean} isHidden - The current visibility state of the menu sections.
   */
  function updateSectionToggleButtonText(isHidden) {
    if (menuSectionsToggle) {
      menuSectionsToggle.textContent = isHidden
        ? "Show Menu Sections"
        : "Hide Menu Sections";
    }
  }

  // On wider screens, ensure the mobile-toggled nav is visible
  // and the main nav sections are not hidden by default.
  const mediaQuery = window.matchMedia("(min-width: 1024px)");
  function handleDesktopView(e) {
    if (e.matches) {
      sidebar.classList.remove("nav-open");
      // Optional: decide if menu sections should re-open on resize to desktop
      // mainNav.classList.remove('sections-hidden');
      // updateSectionToggleButtonText(false);
    }
  }
  mediaQuery.addEventListener("change", handleDesktopView);
  handleDesktopView(mediaQuery); // Initial check
});
