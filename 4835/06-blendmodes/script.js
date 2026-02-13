var menuToggleTrigger = document.querySelector(".button-as-toggler");
var panelCloseTrigger = document.querySelector(".button-as-closer");
var greyscaleToggleTrigger = document.querySelector(".button-as-filter");
var primaryContentArea = document.querySelector(".main-as-primary");
var galleryItems = document.querySelectorAll(".figure-as-item");
var controlsForm = document.querySelector(".form-as-controls");
var colorChooserInput = document.querySelector(".input-as-chooser");
var statusBarText = document.querySelector(".span-as-value");

function procureRandomInteger() {
  return Math.floor(Math.random() * 200);
}

function fabricateRandomColorString() {
  return (
    "rgb(" +
    procureRandomInteger() +
    ", " +
    procureRandomInteger() +
    ", " +
    procureRandomInteger() +
    ")"
  );
}

function adjustCompositionMode(compositionValue) {
  for (var i = 0; i < galleryItems.length; i++) {
    var imageElement = galleryItems[i].querySelector("img");
    if (imageElement) {
      imageElement.style.mixBlendMode = compositionValue;
    }
  }
  statusBarText.textContent = compositionValue;
}

function applyHueToAllItems(hueValue) {
  for (var i = 0; i < galleryItems.length; i++) {
    var item = galleryItems[i];
    var overlay = item.querySelector(".figcaption-as-overlay");
    var overlayText = overlay.querySelector("span");
    var transparentHue = hueValue + "cc";

    item.style.backgroundColor = hueValue;
    overlay.style.backgroundColor = transparentHue;
    overlayText.textContent = hueValue;
  }
}

function processModeSelection(evt) {
  if (evt.target.type === "color") {
    return;
  }
  var selectedMode = evt.target.value;
  adjustCompositionMode(selectedMode);
}

function processColorSelection(evt) {
  var selectedHue = evt.target.value;
  applyHueToAllItems(selectedHue);
}

function processGalleryClick(evt) {
  var currentMode = document.querySelector(
    'input[name="blendmode"]:checked'
  ).value;
  adjustCompositionMode(currentMode);

  var nearestItem = evt.target.closest(".figure-as-item");
  if (!nearestItem) {
    return;
  }
  nearestItem.classList.toggle("overlay-as-active");
}

function revealControlPanel() {
  document.body.classList.toggle("figure-as-active");
}

function activateMonochromeFilter() {
  document.body.classList.toggle("filter-as-active");
}

function dismissAllOverlays() {
  var activeOverlays = document.querySelectorAll(".overlay-as-active");
  for (var i = 0; i < activeOverlays.length; i++) {
    activeOverlays[i].classList.remove("overlay-as-active");
  }
  document.body.classList.remove("figure-as-active");
}

function commenceApplication() {
  for (var i = 0; i < galleryItems.length; i++) {
    var item = galleryItems[i];
    var overlay = item.querySelector(".figcaption-as-overlay");
    var overlayText = overlay.querySelector("span");
    var randomHue = fabricateRandomColorString();

    item.style.backgroundColor = randomHue;
    overlay.style.backgroundColor = randomHue;
    overlayText.textContent = randomHue;
  }

  var initialMode = document.querySelector(
    'input[name="blendmode"]:checked'
  ).value;
  adjustCompositionMode(initialMode);

  menuToggleTrigger.addEventListener("click", revealControlPanel);
  greyscaleToggleTrigger.addEventListener("click", activateMonochromeFilter);
  panelCloseTrigger.addEventListener("click", dismissAllOverlays);
  controlsForm.addEventListener("change", processModeSelection);
  colorChooserInput.addEventListener("input", processColorSelection);
  primaryContentArea.addEventListener("click", processGalleryClick);
}

commenceApplication();
