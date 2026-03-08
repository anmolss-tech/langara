/*
  @Made By: 
 */
import { auth } from "../../../services/business-side/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { ProductService } from "../../../services/business-side/ProductService.js";
import { showModal } from "../../../controller/components/modal.js";


let currentProduct = null
let currentProductId = null
const currentImageFiles = []
let existingImageUrls = []
const imagesToDelete = []
let newMeasurementFile = null

let stream = null

async function startCamera() {
  if (currentImageFiles.length + existingImageUrls.length >= 3) {
    showModal("Image Limit Reached", "You can have a maximum of 3 images.", {
      iconType: "warning",
      confirmText: "OK",
    })
    return
  }
  const cameraModal = document.getElementById("cameraModal")
  const cameraFeed = document.getElementById("cameraFeed")
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      })
      cameraFeed.srcObject = stream
      cameraModal.classList.add("active")
    } catch (error) {
      console.error("Error accessing camera:", error)
      showModal("Camera Error", "Could not access the camera. Please check permissions.", {
        isDanger: true,
        confirmText: "OK",
      })
    }
  } else {
    showModal("Unsupported", "Your browser does not support camera access.", {
      isDanger: true,
      confirmText: "OK",
    })
  }
}

function stopCamera() {
  const cameraModal = document.getElementById("cameraModal")
  const cameraFeed = document.getElementById("cameraFeed")
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
  cameraFeed.srcObject = null
  cameraModal.classList.remove("active")
}

function captureImage() {
  const cameraFeed = document.getElementById("cameraFeed")
  const cameraCanvas = document.getElementById("cameraCanvas")
  const context = cameraCanvas.getContext("2d")
  cameraCanvas.width = cameraFeed.videoWidth
  cameraCanvas.height = cameraFeed.videoHeight
  context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height)
  cameraCanvas.toBlob((blob) => {
    const fileName = `photo-${Date.now()}.jpg`
    const file = new File([blob], fileName, {
      type: "image/jpeg",
    })
    currentImageFiles.push(file)
    renderImagePreviews()
  }, "image/jpeg")
  stopCamera()
}

async function initializeApp(user) {
  currentProductId = new URLSearchParams(window.location.search).get("id")
  if (!currentProductId) {
    showModal(
      "Error: Invalid Page",
      "No product ID was specified in the URL. You will be redirected to your inventory.",
      {
        confirmText: "OK",
        onConfirm: () => {
          window.location.href = "./b-home.html"
        },
      },
    )
    return
  }

  try {
    const product = await ProductService.getProductById(currentProductId)
    if (!product) {
      showModal(
        "Error: Product Not Found",
        "The product you are trying to edit could not be found. It may have been deleted.",
        {
          confirmText: "Return to Inventory",
          onConfirm: () => {
            window.location.href = "./b-home.html"
          },
        },
      )
      return
    }

    currentProduct = product
    populateForm(product)
    setupEventListeners()
  } catch (error) {
    console.error("Failed to load product for editing:", error)
    showModal(
      "Error Loading Data",
      "A network or database error occurred while loading the product data. Please try again.",
      {
        confirmText: "Try Again",
        isDanger: true,
        onConfirm: () => {
          window.location.reload()
        },
      },
    )
  }
}

function setupEventListeners() {
  const form = document.getElementById("bAddItemForm")
  const imageUploadButton = document.getElementById("imageUploadButton")
  const imageUploadInput = document.getElementById("imageUploadInput")
  const measurementUploadButton = document.getElementById("measurementUploadButton")
  const measurementUploadInput = document.getElementById("measurementUploadInput")
  const previewContainer = document.getElementById("imagePreviewContainer")

  const cameraButton = document.getElementById("cameraButton")
  const captureButton = document.getElementById("captureButton")
  const cancelCameraButton = document.getElementById("cancelCameraButton")

  cameraButton.addEventListener("click", startCamera)
  captureButton.addEventListener("click", captureImage)
  cancelCameraButton.addEventListener("click", stopCamera)

  imageUploadButton.addEventListener("click", () => imageUploadInput.click())
  imageUploadInput.addEventListener("change", (event) => handleNewImageFiles(event.target.files))

  measurementUploadButton.addEventListener("click", () => measurementUploadInput.click())
  measurementUploadInput.addEventListener("change", handleNewMeasurementFile)

  previewContainer.addEventListener("click", handlePreviewClick)

  form.addEventListener("submit", handleFormSubmit)

  const cancelButton = form.querySelector(".b-add-action-buttons__btn--secondary")
  cancelButton.addEventListener("click", () => {
    showModal("Cancel Edits?", "Are you sure you want to cancel? All unsaved changes will be lost.", {
      confirmText: "Discard Changes",
      isDanger: true,
      onConfirm: () => {
        window.location.href = `./b-detail-item.html?id=${currentProduct.id}`
      },
    })
  })

  setupDropdownToggles()
}


function setupDropdownToggles() {
  const fieldsets = document.querySelectorAll("fieldset.b-add-form-section")

  fieldsets.forEach((fieldset) => {
    const legend = fieldset.querySelector(".b-add-form-group__legend")
    const tagSelector = fieldset.querySelector(".b-add-tag-selector")

    if (legend && tagSelector) {
      fieldset.classList.add("b-add-form-section--collapsible")

      legend.addEventListener("click", () => {
        fieldset.classList.toggle("expanded")
      })
    }
  })
}

function handleNewImageFiles(files) {
  const newFiles = Array.from(files)
  const slotsAvailable = 3 - (currentImageFiles.length + existingImageUrls.length)

  if (newFiles.length > 0 && slotsAvailable > 0) {
    currentImageFiles.push(...newFiles.slice(0, slotsAvailable))
    renderImagePreviews()
  }
}

function handleNewMeasurementFile(event) {
  const fileNameDisplay = document.getElementById("measurementFileName")
  console.log(fileNameDisplay)
  if (event.target.files.length > 0) {
    newMeasurementFile = event.target.files[0]
    fileNameDisplay.textContent = newMeasurementFile.name
  }
}

function handlePreviewClick(event) {
  if (event.target.classList.contains("b-add-image-uploader__remove-btn")) {
    const wrapper = event.target.closest(".b-add-image-uploader__preview-wrapper")
    const urlToDelete = wrapper.dataset.url
    const fileIndex = wrapper.dataset.fileIndex

    if (urlToDelete) {
      imagesToDelete.push(urlToDelete)
      existingImageUrls = existingImageUrls.filter((url) => url !== urlToDelete)
    } else if (fileIndex) {
      currentImageFiles.splice(Number.parseInt(fileIndex, 10), 1)
    }

    renderImagePreviews()
  }
}

function renderImagePreviews() {
  const previewContainer = document.getElementById("imagePreviewContainer")
  previewContainer.innerHTML = ""

  existingImageUrls.forEach((url) => {
    const wrapper = document.createElement("div")
    wrapper.className = "b-add-image-uploader__preview-wrapper"
    wrapper.dataset.url = url
    wrapper.innerHTML = `
            <img src="${url}" class="b-add-image-uploader__image" alt="Existing item image">
            <button type="button" class="b-add-image-uploader__remove-btn">&times;</button>
        `
    previewContainer.appendChild(wrapper)
  })

  currentImageFiles.forEach((file, index) => {
    const wrapper = document.createElement("div")
    wrapper.className = "b-add-image-uploader__preview-wrapper"
    wrapper.dataset.fileIndex = index

    const reader = new FileReader()
    reader.onload = (event) => {
      wrapper.innerHTML = `
                <img src="${event.target.result}" class="b-add-image-uploader__image" alt="New item preview">
                <button type="button" class="b-add-image-uploader__remove-btn">&times;</button>
            `
    }
    reader.readAsDataURL(file)
    previewContainer.appendChild(wrapper)
  })

  updateAddButtonVisibility()
}

function updateAddButtonVisibility() {
  const imageUploadButton = document.getElementById("imageUploadButton")
  const cameraButton = document.getElementById("cameraButton")
  const totalImages = currentImageFiles.length + existingImageUrls.length

  if (totalImages >= 3) {
    imageUploadButton.style.display = "none"
    cameraButton.style.display = "none"
  } else {
    imageUploadButton.style.display = "flex"
    cameraButton.style.display = "flex"
  }
}


async function handleFormSubmit(event) {
  event.preventDefault()
  const submitButton = event.target.querySelector(".b-add-action-buttons__btn--primary")
  submitButton.disabled = true
  submitButton.textContent = "SAVING..."

  try {
    const updatedData = getFormData(event.target)
    console.log(newMeasurementFile);
    await ProductService.updateProduct(
      currentProduct.id,
      updatedData,
      currentImageFiles,
      existingImageUrls,
      imagesToDelete,
      newMeasurementFile,
    )

    showModal("Success!", "The item has been updated successfully.", {
      confirmText: "View Item",
      onConfirm: () => {
        window.location.href = `./b-detail-item.html?id=${currentProduct.id}`
      },
    })
  } catch (error) {
    console.error("Failed to update product:", error)
    showModal("Update Failed", error.message || "An error occurred while saving the item. Please try again.", {
      isDanger: true,
      confirmText: "OK",
    })
    submitButton.disabled = false
    submitButton.textContent = "UPDATE"
  }
}

function getFormData(form) {
  return {
    itemName: form.querySelector("#itemNameInput").value.trim(),
    description: form.querySelector("#fullDescriptionInput").value.trim(),
    price: Number.parseFloat(form.querySelector("#priceInput").value) || 0,
    category: getSelectedCheckboxValues("category"),
    colors: getSelectedCheckboxValues("color-preset"),
    gender: getRadioValue("gender"),
    sizes: getSelectedCheckboxValues("size"),
    sizeFit: getSelectedCheckboxValues("sizeFit"),
    texture: getSelectedCheckboxValues("texture"),
    season: getSelectedCheckboxValues("season"),
    style: getSelectedCheckboxValues("style"),
    material: getSelectedCheckboxValues("material"),
  }
}

function populateForm(product) {
  document.getElementById("itemNameInput").value = product.itemName || ""
  document.getElementById("fullDescriptionInput").value = product.description || ""
  document.getElementById("priceInput").value = product.price || 0

  setCheckboxValues("category", product.category)
  setCheckboxValues("color-preset", product.colors)
  setCheckboxValues("size", product.sizes)
  setCheckboxValues("sizeFit", product.sizeFit)
  setCheckboxValues("texture", product.texture)
  setCheckboxValues("season", product.season)
  setCheckboxValues("style", product.style)
  setCheckboxValues("material", product.material)
  setRadioValue("gender", product.gender)

  existingImageUrls = [...product.images]
  renderImagePreviews()

  if (product.measurementTableUrl) {
    const fileName = product.measurementTableUrl.split("/").pop().split("?")[0].split("%2F").pop()
    document.getElementById("measurementFileName").textContent = decodeURIComponent(fileName)
  }
}

function setCheckboxValues(name, values) {
  if (!values || !Array.isArray(values)) return
  document.querySelectorAll(`input[name="${name}"]`).forEach((checkbox) => {
    checkbox.checked = values.includes(checkbox.value)
  })
}

function setRadioValue(name, value) {
  if (!value) return
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`)
  if (radio) radio.checked = true
}

function getSelectedCheckboxValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value)
}

function getRadioValue(name) {
  const radio = document.querySelector(`input[name="${name}"]:checked`)
  return radio ? radio.value : null
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    initializeApp(user)
  } else {
    console.log("User not authenticated. Redirecting to login.")
    window.location.href = "./auth-login-business.html"
  }
})
