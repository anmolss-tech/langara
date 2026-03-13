// @Made By: Anmol Singh
let currentSortOption = "recent"

function openSortModal() {
  const modal = document.getElementById("sortModal")
  const sortBtn = document.querySelector(".sort-btn")

  if (modal && sortBtn) {
    const modalContent = modal.querySelector(".sort-modal-content")
    const btnRect = sortBtn.getBoundingClientRect()

    modalContent.style.top = `${btnRect.bottom + window.scrollY + 8}px`
    modalContent.style.left = `${btnRect.left + window.scrollX}px`

    modal.style.display = "block"
  }
}

function closeSortModal() {
  const modal = document.getElementById("sortModal")
  if (modal) {
    modal.style.display = "none"
  }
}

window.addEventListener("click", (event) => {
  const modal = document.getElementById("sortModal")
  const sortBtn = document.querySelector(".sort-btn")

  if (modal && event.target === modal) {
    closeSortModal()
  }

  if (sortBtn && event.target === sortBtn) {
    return
  }
})

function initializeSortModal() {
  const sortOptions = document.querySelectorAll('.sort-option input[type="radio"]')

  sortOptions.forEach((option) => {
    option.addEventListener("change", function () {
      if (this.checked) {
        currentSortOption = this.value
        applySorting(this.value)

        setTimeout(() => {
          closeSortModal()
        }, 200)
      }
    })
  })
}


function applySorting(sortType) {
  
  const sortEvent = new CustomEvent("sortApplied", {
    detail: {
      sortType: sortType,
      label: getSortLabel(sortType),
    },
  })
  window.dispatchEvent(sortEvent)
}


function getSortLabel(sortType) {
  const labels = {
    recent: "Recently added",
    "high-to-low": "$ High to Low",
    "low-to-high": "$ Low to High",
  }
  return labels[sortType] || sortType
}


function getCurrentSort() {
  return currentSortOption
}


document.addEventListener("DOMContentLoaded", () => {
  
  const sortModalContainer = document.getElementById("sort-modal-container")
  if (sortModalContainer) {
    fetch("/view/components/pages/sort-modal.html")
      .then((response) => response.text())
      .then((html) => {
        sortModalContainer.innerHTML = html
        initializeSortModal()
      })
      .catch((error) => console.error("Error loading sort modal:", error))
  } else {
    
    initializeSortModal()
  }
})


window.openSortModal = openSortModal
window.closeSortModal = closeSortModal
window.getCurrentSort = getCurrentSort
