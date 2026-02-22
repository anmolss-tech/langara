document.addEventListener("DOMContentLoaded", () => {
  /**
   * Toggles the collapsed state of the sidebar/header content.
   * It adds/removes the 'is-collapsed' class to the sidebar element.
   * This works for the top header on mobile and the side panel on desktop.
   */
  const sidebarCollapseToggle = document.getElementById(
    "sidebarCollapseToggle"
  );
  const sidebar = document.getElementById("sidebar");

  if (sidebarCollapseToggle && sidebar) {
    sidebarCollapseToggle.addEventListener("click", () => {
      sidebar.classList.toggle("is-collapsed");
    });
  }
});
