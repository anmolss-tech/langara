/*
  @Made By: 
 */
import { ProductService } from "../../services/business-side/ProductService.js";
import { auth } from "../../services/business-side/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { BusinessProfileService } from "../../services/business-side/BusinessProfileService.js";
import { showModal } from "../../controller/components/modal.js";

let dynamicProfileId = null;
let dynamicBusinessId = null;
let dynamicBusinessName = null;
let currentImageFiles = [];
let existingImageUrls = [];
let autoPopulatedMeasurementUrl = null; 
let stream = null;

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initializeApp(user);
    } else {
      console.log("No user logged in. Redirecting to login.");
      window.location.href = "./auth-login-business.html";
    }
  });
});

async function initializeApp(user) {
  console.log("[AddItemPage] User authenticated. Initializing application...");

  try {
    const profileData = await BusinessProfileService.getBusinessProfileData(user);
    dynamicProfileId = profileData.profileId;
    dynamicBusinessId = profileData.id;
    dynamicBusinessName = profileData.businessName;
    
    console.log(`[AddItemPage] Fetched dynamic IDs -> profileID: ${dynamicProfileId}, businessID: ${dynamicBusinessId}`);

    setupAllEventListeners();
  } catch (error) {
    console.error("Critical Error: Could not fetch business profile data.", error);
    showModal(
      "Initialization Failed",
      "Could not load necessary business information. Please try refreshing the page.",
      {
        confirmText: "Go to Home",
        isDanger: true,
        onConfirm: () => {
          window.location.href = "./b-home.html";
        },
      }
    );
    const submitButton = document.querySelector(".b-add-action-buttons__btn--primary");
    if (submitButton) submitButton.disabled = true;
  }
}

async function startCamera() {
  const totalImages = currentImageFiles.length + existingImageUrls.length;
  if (totalImages >= 3) {
    showModal("Image Limit Reached", "You can upload a maximum of 3 images.", {
      iconType: "warning",
      confirmText: "OK",
    });
    return;
  }

  const cameraModal = document.getElementById("cameraModal");
  const cameraFeed = document.getElementById("cameraFeed");

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      cameraFeed.srcObject = stream;
      cameraModal.classList.add("active");
    } catch (error) {
      console.error("Error accessing camera:", error);
      showModal("Camera Error", "Could not access the camera. Please check your browser permissions.", {
        isDanger: true,
        confirmText: "OK",
      });
    }
  } else {
    showModal("Unsupported", "Your browser does not support camera access.", { isDanger: true, confirmText: "OK" });
  }
}

function stopCamera() {
  const cameraModal = document.getElementById("cameraModal");
  const cameraFeed = document.getElementById("cameraFeed");
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  cameraFeed.srcObject = null;
  cameraModal.classList.remove("active");
}

function captureImage() {
  const cameraFeed = document.getElementById("cameraFeed");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const context = cameraCanvas.getContext("2d");

  cameraCanvas.width = cameraFeed.videoWidth;
  cameraCanvas.height = cameraFeed.videoHeight;
  context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);

  cameraCanvas.toBlob((blob) => {
    const fileName = `photo-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: "image/jpeg" });

    currentImageFiles.push(file);
    renderImagePreviews();
  }, "image/jpeg");

  stopCamera();
}

function setupAllEventListeners() {
  const form = document.getElementById("bAddItemForm");
  const imageUploadButton = document.getElementById("imageUploadButton");
  const imageUploadInput = document.getElementById("imageUploadInput");
  const measurementUploadButton = document.getElementById("measurementUploadButton");
  const measurementUploadInput = document.getElementById("measurementUploadInput");

  setupDropdownToggles();

 
  form.addEventListener('autopopulate-data', (e) => {
    console.log('Received autopopulate-data event:', e.detail);
    const data = e.detail;
    
    
    if(form.querySelector("#itemNameInput")) form.querySelector("#itemNameInput").value = data.itemName;
    if(form.querySelector("#fullDescriptionInput")) form.querySelector("#fullDescriptionInput").value = data.description;
    if(form.querySelector("#priceInput")) form.querySelector("#priceInput").value = data.price;

    
    const check = (name, values) => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(i => {
            const isChecked = Array.isArray(values) ? values.includes(i.value) : values === i.value;
            i.checked = isChecked;
        });
    };

    check("category", data.categories);
    check("color-preset", data.colors);
    check("gender", data.genders);
    check("size", data.sizes);
    check("sizeFit", data.sizeFit);
    check("texture", data.textures);
    check("season", data.seasons);
    check("style", data.styles);
    check("material", data.materials);

   
    existingImageUrls = data.images || [];
    currentImageFiles = []; 
    renderImagePreviews();

    
    const measurementFileName = document.getElementById("measurementFileName");
    if (measurementFileName && data.measurementTableUrl) {
        autoPopulatedMeasurementUrl = data.measurementTableUrl;
        try {
            const urlParts = data.measurementTableUrl.split('%2F');
            const fileNameWithToken = urlParts[urlParts.length - 1];
            measurementFileName.textContent = decodeURIComponent(fileNameWithToken.split('?')[0]);
        } catch (e) {
            measurementFileName.textContent = "Size Chart Loaded";
        }
    }
  });

  
  const cameraButton = document.getElementById("cameraButton");
  const captureButton = document.getElementById("captureButton");
  const cancelCameraButton = document.getElementById("cancelCameraButton");

  if (cameraButton) cameraButton.addEventListener("click", startCamera);
  if (captureButton) captureButton.addEventListener("click", captureImage);
  if (cancelCameraButton) cancelCameraButton.addEventListener("click", stopCamera);

  
  if (imageUploadButton) imageUploadButton.addEventListener("click", () => imageUploadInput.click());
  if (imageUploadInput) imageUploadInput.addEventListener("change", (event) => handleImageFiles(event.target.files));

  
  if (measurementUploadButton) measurementUploadButton.addEventListener("click", () => measurementUploadInput.click());
  if (measurementUploadInput) measurementUploadInput.addEventListener("change", (event) => {
    const fileNameDisplay = document.getElementById("measurementFileName");
    if (event.target.files.length > 0) {
      fileNameDisplay.textContent = event.target.files[0].name;
      autoPopulatedMeasurementUrl = null;
    }
  });

  form.addEventListener("submit", handleFormSubmit);

  const cancelButton = form.querySelector(".b-add-action-buttons__btn--secondary");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      showModal("Discard Item?", "Are you sure? All information entered will be lost.", {
        confirmText: "Discard",
        isDanger: true,
        onConfirm: () => {
          window.location.href = "./b-home.html";
        },
      });
    });
  }
}

function setupDropdownToggles() {
  const fieldsets = document.querySelectorAll("fieldset.b-add-form-section");
  fieldsets.forEach((fieldset) => {
    const legend = fieldset.querySelector(".b-add-form-group__legend");
    if (legend) {
      fieldset.classList.add("b-add-form-section--collapsible", "expanded");
      legend.addEventListener("click", (e) => {
        e.preventDefault();
        fieldset.classList.toggle("expanded");
      });
    }
  });
}


async function convertUrlsToFiles(urls) {
    const filePromises = urls.map(async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            
            let fileName = "autopopulated-image.jpg";
            try {
               fileName = url.split('/').pop().split('?')[0];
            } catch(e) {}
            
            return new File([blob], fileName, { type: blob.type });
        } catch (e) {
            console.error("Error converting URL to file", e);
            return null;
        }
    });
    const files = await Promise.all(filePromises);
    return files.filter(f => f !== null);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const submitButton = event.target.querySelector(".b-add-action-buttons__btn--primary");
  
  const validationError = validateForm();
  if (validationError) {
    showModal("Missing Information", validationError, { iconType: "warning", confirmText: "OK" });
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "SAVING...";

  try {
    const formDataText = getFormData(event.target);
    
    
    let imageFiles = [...currentImageFiles];
    
    
    if (existingImageUrls.length > 0) {
        console.log("Converting auto-populated URLs to files...");
        const convertedFiles = await convertUrlsToFiles(existingImageUrls);
        imageFiles = [...imageFiles, ...convertedFiles];
    }

    
    let measurementFile = getMeasurementFile();
    if (!measurementFile && autoPopulatedMeasurementUrl) {
         const convertedMeasurement = await convertUrlsToFiles([autoPopulatedMeasurementUrl]);
         if(convertedMeasurement.length > 0) measurementFile = convertedMeasurement[0];
    }

    
    if (imageFiles.length === 0) {
      throw new Error("Could not process images. Please try uploading manually.");
    }

    
    
    const newProduct = await ProductService.createNewProduct(
        formDataText, 
        imageFiles, 
        measurementFile
    );

    showModal("Success!", "Your new item has been added successfully.", {
      confirmText: "View Item",
      onConfirm: () => {
        window.location.href = `./b-detail-item.html?id=${newProduct.id}`;
      },
    });
  } catch (error) {
    console.error("Failed to create product:", error);
    showModal("Creation Failed", error.message || "An error occurred while saving your new item. Please try again.", {
      isDanger: true,
      confirmText: "OK",
    });
    submitButton.disabled = false;
    submitButton.textContent = "ADD ITEM";
  }
}

function getFormData(form) {
  if (!dynamicProfileId || !dynamicBusinessId) {
    throw new Error("Dynamic profileID or businessID is not available. Cannot submit form.");
  }

  return {
    profileID: dynamicProfileId,
    businessID: dynamicBusinessId,
    businessName: dynamicBusinessName,
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
  };
}

function validateForm() {
  
  const totalImages = currentImageFiles.length + existingImageUrls.length;

  if (totalImages === 0) {
    return "Please upload at least one image for the item.";
  }
  if (document.getElementById("itemNameInput").value.trim() === "") {
    return "Please enter an item name.";
  }
  if (document.getElementById("fullDescriptionInput").value.trim() === "") {
    return "Please enter a description.";
  }
  if (getSelectedCheckboxValues("category").length === 0) {
    return "Please select at least one category.";
  }
  if (getRadioValue("gender") === null) {
    return "Please select a gender.";
  }
  if (getSelectedCheckboxValues("size").length === 0) {
    return "Please select at least one size.";
  }
  if (getSelectedCheckboxValues("color-preset").length === 0) {
    return "Please select at least one color.";
  }
  
  return null;
}

function handleImageFiles(files) {
  const newFiles = Array.from(files);
  const currentTotal = currentImageFiles.length + existingImageUrls.length;
  const slotsAvailable = 3 - currentTotal;

  if (newFiles.length > 0 && slotsAvailable > 0) {
    currentImageFiles.push(...newFiles.slice(0, slotsAvailable));
    renderImagePreviews();
  } else if (slotsAvailable <= 0) {
    showModal("Image Limit Reached", "You can upload a maximum of 3 images.", { iconType: 'warning', confirmText: 'OK' });
  }
}

function renderImagePreviews() {
  const previewContainer = document.getElementById("imagePreviewContainer");
  if (!previewContainer) return;
  
  previewContainer.innerHTML = "";

  
  existingImageUrls.forEach((url, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "b-add-image-uploader__preview-wrapper";
    wrapper.innerHTML = `
        <img src="${url}" class="b-add-image-uploader__image" alt="Existing preview">
        <button type="button" class="b-add-image-uploader__remove-btn" data-type="existing" data-index="${index}">&times;</button>
    `;
    previewContainer.appendChild(wrapper);
  });

  
  currentImageFiles.forEach((file, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "b-add-image-uploader__preview-wrapper";

    const reader = new FileReader();
    reader.onload = (event) => {
      wrapper.innerHTML = `
            <img src="${event.target.result}" class="b-add-image-uploader__image" alt="New upload preview">
            <button type="button" class="b-add-image-uploader__remove-btn" data-type="new" data-index="${index}">&times;</button>
        `;
    };
    reader.readAsDataURL(file);
    previewContainer.appendChild(wrapper);
  });

  updateAddButtonVisibility();
}


const previewContainer = document.getElementById("imagePreviewContainer");
if (previewContainer) {
    previewContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("b-add-image-uploader__remove-btn")) {
        const indexToRemove = Number.parseInt(event.target.dataset.index, 10);
        const type = event.target.dataset.type;

        if (type === "existing") {
            existingImageUrls.splice(indexToRemove, 1);
        } else {
            currentImageFiles.splice(indexToRemove, 1);
        }
        renderImagePreviews();
    }
    });
}

function updateAddButtonVisibility() {
  const imageUploadButton = document.getElementById("imageUploadButton");
  const cameraButton = document.getElementById("cameraButton");
  const totalImages = currentImageFiles.length + existingImageUrls.length;

  if (imageUploadButton && cameraButton) {
    if (totalImages >= 3) {
        imageUploadButton.style.display = "none";
        cameraButton.style.display = "none";
    } else {
        imageUploadButton.style.display = "flex";
        cameraButton.style.display = "flex";
    }
  }
}

function getMeasurementFile() {
  const input = document.getElementById("measurementUploadInput");
  return input && input.files.length > 0 ? input.files[0] : null;
}

function getSelectedCheckboxValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function getRadioValue(name) {
  const radio = document.querySelector(`input[name="${name}"]:checked`);
  return radio ? radio.value : null;
}