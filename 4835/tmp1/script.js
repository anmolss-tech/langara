function resetAllViews() {
  const hiddenRadios = document.querySelectorAll(
    'input[data-type="view-toggle-hide"]'
  );
  hiddenRadios.forEach((radio) => {
    radio.checked = true;
  });
}
