/*
  @Made By: 
 */
import { auth } from "../../../services/business-side/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { BusinessProfileService } from "../../../services/business-side/BusinessProfileService.js";
import { showModal } from "../components/modal.js";
import { geocodeAddress } from "../../services/business-side/Geocoding.js";


let selectedImageFile = null;

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initializeApp(user);
    } else {
      window.location.href = "./auth-login-business.html";
    }
  });
});

async function initializeApp(user) {
  const elements = {
    brandNameInput: document.getElementById("brandName"),
    addressInput: document.getElementById("address"),
    emailInput: document.getElementById("email"),
    uploadBox: document.getElementById("uploadBox"),
    saveButton: document.querySelector(".save-btn"),
    imageInput: createHiddenFileInput(),
  };

  try {
    const profileData = await BusinessProfileService.getBusinessProfileData(user);
    populateForm(elements, profileData);
    setupEventListeners(elements);
  } catch (error) {
    console.error("Failed to initialize profile page:", error);
    showModal("Error", "Could not load your profile data. Please try again later.", { isDanger: true });
    elements.saveButton.disabled = true;
  }
}

function populateForm(elements, data) {
  console.log(data);
  elements.brandNameInput.value = data.businessName || "";
  // Modified to correctly read the address from the location map
  elements.addressInput.value = data.address || "";
  elements.emailInput.value = data.email || "";

  if (data.brandImageUrl) {
    elements.uploadBox.innerHTML = `<img src="${data.brandImageUrl}" alt="Brand Logo Preview">`;
  } else {
    elements.uploadBox.innerHTML = "+";
  }
}

function setupEventListeners(elements) {
  elements.uploadBox.addEventListener("click", () => {
    elements.imageInput.click();
  });

  elements.imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      elements.uploadBox.innerHTML = `<img src="${e.target.result}" alt="New Brand Logo Preview">`;
    };
    reader.readAsDataURL(file);
  });

  elements.saveButton.addEventListener("click", () => {
    handleSave(elements);
  });
}

function handleSave(elements) {
  elements.saveButton.disabled = true;
  elements.saveButton.textContent = "SAVING...";

  const updateData = {
    businessName: elements.brandNameInput.value.trim(),
    address: elements.addressInput.value.trim(),
    email: elements.emailInput.value.trim(),
  };

  const user = auth.currentUser;

  if (updateData.email && updateData.email.toLowerCase() !== user.email.toLowerCase()) {
    showModal(
      "Confirm Your Identity",
      "For security, please enter your current password to change your email address.",
      {
        confirmText: "Confirm",
        inputType: 'password',
        onConfirm: (password) => {
          if (!password) {
            showModal("Error", "Password cannot be empty.", { isDanger: true });
            elements.saveButton.disabled = false;
            elements.saveButton.textContent = "SAVE";
            return;
          }
          performUpdate(updateData, selectedImageFile, password, elements);
        },
        onCancel: () => {
          elements.saveButton.disabled = false;
          elements.saveButton.textContent = "SAVE";
        }
      }
    );
  } else {
    performUpdate(updateData, selectedImageFile, null, elements);
  }
} 

async function performUpdate(updateData, imageFile, password, elements) {
  try {
    const newGeopoint = await geocodeAddress(updateData.address);
    if (!newGeopoint) {
        throw new Error("Geocoding failed for the provided address.");
    }

    const finalUpdateData = {
        businessName: updateData.businessName,
        email: updateData.email,
        location: {
            address: updateData.address,
            geopoint: newGeopoint
        }
    };

    const originalEmail = auth.currentUser.email;
    await BusinessProfileService.updateBusinessProfile(finalUpdateData, imageFile, password);
 if (password && updateData.email.toLowerCase() !== originalEmail.toLowerCase()) {
      showModal(
        "Verification Sent!",
        `🔗 A verification link has been sent to ${updateData.email}.`, 
        { 
            confirmText: 'Log Out',
            onConfirm: () => {
              
                auth.signOut();
               
                window.location.href = './auth-login-business.html';
            }
        }
      );
    } else {
      
      showModal("Success!", "Your profile has been updated successfully.", { 
          confirmText: 'OK',
          onConfirm: () => { selectedImageFile = null; }
      });
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
    if (error.message.includes("Geocoding failed")) {
        showModal("Invalid Address", "We couldn't find that address. Please check it and try again.", { 
            iconType: 'warning', 
            confirmText: 'OK' 
        });
    }else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      showModal("Update Failed", "The password you entered was incorrect. Your email was not changed.", { 
          iconType: 'warning', 
          confirmText: 'OK' 
      });
    } else if (error.code === 'auth/email-already-in-use') {
      showModal("Update Failed", "The email address you entered is already in use by another account. Please choose a different email.", { 
          iconType: 'warning', 
          confirmText: 'OK' 
      });
    } else {
      showModal("Update Failed", "An unexpected error occurred while saving. Please try again.", { 
          iconType: 'warning', 
          confirmText: 'OK' 
      });
    }

  } finally {
    elements.saveButton.disabled = false;
    elements.saveButton.textContent = "SAVE";
  }
}

function createHiddenFileInput() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  document.body.appendChild(input);
  return input;
}