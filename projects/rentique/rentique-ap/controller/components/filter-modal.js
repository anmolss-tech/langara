/*
  @Made By: 
 */
let priceSliderInstance = null;
let hasFilterResetPressed = false; 
const selectedFilters = {
  category: [],
  size: [],
  distance: 0,
  style: [],
  material: [],
  texture: [],
  season: [],
  color: [],
  gender: [],
  price_min: 1,
  price_max: 999,
  distance: 120,
}

function openFilterModal() {
  const modal = document.getElementById("filterModal")
  if (modal) {
    modal.style.display = "block"
    document.body.style.overflow = "hidden"
  }
}

function closeFilterModal() {
  const modal = document.getElementById("filterModal")
  if (modal) {
    modal.style.display = "none"
    document.body.style.overflow = "auto"
  }
}

window.onclick = (event) => {
  const modal = document.getElementById("filterModal")
  if (event.target === modal) {
    closeFilterModal()
  }
}

function initializeFilterModal() {
  const sectionTitles = document.querySelectorAll(".filter-section-title")
  sectionTitles.forEach((title) => {
    title.addEventListener("click", function () {
      toggleFilterSection(this)
    })
  })
  
  const filterChips = document.querySelectorAll(".filter-chip")
  filterChips.forEach((chip) => {
    chip.addEventListener("click", function () {
      this.classList.toggle("active")
      updateApplyButton()
    })
  })

  const colorChips = document.querySelectorAll(".color-chip")
  colorChips.forEach((chip) => {
    chip.addEventListener("click", function () {
      this.classList.toggle("active")
      updateApplyButton()
    })
  })

    const priceSliderElement = document.getElementById('price-slider');
    const priceLowerValue = document.getElementById('price-lower-value');
    const priceUpperValue = document.getElementById('price-upper-value');

    if (priceSliderElement) {
        noUiSlider.create(priceSliderElement, {
            start: [1, 999], 
            connect: true,   
            range: {
                'min': 1,
                'max': 999
            },
            step: 1,
            format: {
                to: function (value) {
                    return Math.round(value);
                },
                from: function (value) {
                    return Number(value);
                }
            }
        }
      );
      priceSliderInstance = priceSliderElement.noUiSlider;
        priceSliderElement.noUiSlider.on('update', function (values) {
            const [minVal, maxVal] = values;
            priceLowerValue.textContent = `$${minVal}`;
            priceUpperValue.textContent = `$${maxVal}`;
            selectedFilters.price_min = minVal;
            selectedFilters.price_max = maxVal;
            updateApplyButton();
        });
    }

const distanceSlider = document.getElementById("distanceSlider");
const distanceValue = document.getElementById("distanceValue");
if (distanceSlider && distanceValue) {

  const updateSlider = () => {
    distanceValue.textContent = `${distanceSlider.value} km`;
    selectedFilters.distance = Number.parseInt(distanceSlider.value);
    const percentage = ((distanceSlider.value - distanceSlider.min) / (distanceSlider.max - distanceSlider.min)) * 100;
    distanceSlider.style.setProperty('--track-fill', `${percentage}%`);
    updateApplyButton();
  };  
  distanceSlider.addEventListener("input", updateSlider);
  updateSlider();
}
  const resetBtn = document.getElementById("resetFiltersBtn");
  if (resetBtn) {
      resetBtn.addEventListener("click", resetFilters);
  }

}

function updateApplyButton() {
  const applyBtn = document.querySelector(".apply-btn")
  const hasChipSelections = document.querySelectorAll(".filter-chip.active, .color-chip.active").length > 0;
  const hasPriceChanged = selectedFilters.price_min > 1 || selectedFilters.price_max < 120;
  const hasDistanceChanged = selectedFilters.distance > 0;
  const hasSelections = hasChipSelections || hasPriceChanged || hasDistanceChanged || hasFilterResetPressed;

  if (hasSelections) {
    applyBtn.classList.add("active")
  } else {
    applyBtn.classList.remove("active")
  }
}

function applyFilters() {
  const getActiveChipValues = (sectionName) => {
    return Array.from(
      document.querySelectorAll(`.filter-section [data-section="${sectionName}"] + .filter-options .filter-chip.active`)
    ).map(chip => chip.textContent.trim());
  };

    const getActiveColorValues = () => {
      return Array.from(
          document.querySelectorAll('.filter-section [data-section="color"] + .filter-options .color-chip.active')
      ).map(chip => chip.dataset.color);
  };
  console.log("197: color")
  console.log(getActiveColorValues())
  
  selectedFilters.category = getActiveChipValues('category');
  selectedFilters.size = getActiveChipValues('size');
  selectedFilters.style = getActiveChipValues('style');
  selectedFilters.material = getActiveChipValues('material');
  selectedFilters.texture = getActiveChipValues('texture');
  selectedFilters.season = getActiveChipValues('season');
  selectedFilters.gender = getActiveChipValues('gender');
  selectedFilters.color = getActiveColorValues();
  console.log(`209: selectedFilters.color`)
  console.log(selectedFilters.color)
  console.log("Applied Filters:", selectedFilters);

  const filterEvent = new CustomEvent("filtersApplied", { detail: selectedFilters });
  window.dispatchEvent(filterEvent);

  closeFilterModal();
}

function toggleFilterSection(titleElement) {
  const section = titleElement.closest(".filter-section")
  const content = section.querySelector(".filter-options, .filter-content")
  
  titleElement.classList.toggle("expanded")
  
  if (content) {
    content.classList.toggle("collapsed")
  }
}

function resetFilters() {
  console.log("Resetting all filters...");
  hasFilterResetPressed = true;
  selectedFilters.category = [];
  selectedFilters.size = [];
  selectedFilters.style = [];
  selectedFilters.material = [];
  selectedFilters.texture = [];
  selectedFilters.season = [];
  selectedFilters.color = [];
  selectedFilters.gender = [];
  selectedFilters.price_min = 1;
  selectedFilters.price_max = 999;
  selectedFilters.distance = 0; 
  document.querySelectorAll(".filter-chip.active, .color-chip.active").forEach(chip => {
    chip.classList.remove("active");
  });
  
  if (priceSliderInstance) {
    priceSliderInstance.set([selectedFilters.price_min, selectedFilters.price_max]);
  }
  
  const distanceSlider = document.getElementById("distanceSlider");
  if (distanceSlider) {
    distanceSlider.value = selectedFilters.distance;
    distanceSlider.dispatchEvent(new Event('input'));
  }
  
  updateApplyButton();

  console.log("Filters have been reset.", selectedFilters);
}

document.addEventListener("DOMContentLoaded", () => {
  const filterModalContainer = document.getElementById("filter-modal-container")
  if (filterModalContainer) {
    fetch("/view/components/pages/filter-modal.html")
      .then((response) => response.text())
      .then((html) => {
        filterModalContainer.innerHTML = html
        initializeFilterModal()
      })
      .catch((error) => console.error("Error loading filter modal:", error))
  } else {
    initializeFilterModal()
  }
})

window.openFilterModal = openFilterModal
window.closeFilterModal = closeFilterModal
window.applyFilters = applyFilters
window.toggleFilterSection = toggleFilterSection
