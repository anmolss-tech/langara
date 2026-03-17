/*
  @Revise by: Bella
 */
import { auth } from "../../services/business-side/firebase-init.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { profileService } from "../../services/customer-side/ProfileService.js";
import { initializeLikedItems } from "./c-likedStyles.js";
import { geocodeAddress } from "../../services/business-side/Geocoding.js";
import { showModal } from "../components/modal.js";

let userProfile = null;
const mainMenu = document.getElementById("profile-main-menu");
const contentArea = document.getElementById("profile-content-area");
const backButton = document.getElementById("back-to-menu-btn");
const allSections = document.querySelectorAll(".profile-section-content");

let favoriteStyles = [];
let favoriteColors = [];
let stylesToTry = [];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userProfile = await profileService.getUserProfile();
    if (userProfile) {
      console.log("[v0] Profile loaded:", userProfile);
      initializeEventListeners();
    } else {
      mainMenu.innerHTML = "<p>Error: Could not load profile.</p>";
    }
  } else {
    window.location.href = "./auth-login-customer.html";
  }
});

function initializeEventListeners() {
  mainMenu.addEventListener("click", (e) => {
    if (e.target.matches(".profile-btn")) showSection(e.target.dataset.section);
  });
  backButton.addEventListener("click", showMainMenu);
  document
    .getElementById("updateProfileBtn")
    .addEventListener("click", handleUpdateProfile);
  document
    .getElementById("preferenceForm")
    .addEventListener("submit", handleUpdatePreferences);
  document
    .getElementById("securityForm")
    .addEventListener("submit", handleChangePassword);
  document
    .getElementById("profilePhotoPreview")
    .addEventListener("click", () =>
      document.getElementById("profilePhotoInput").click()
    );
  document
    .getElementById("profilePhotoInput")
    .addEventListener("change", handlePhotoUpload);
  document
    .getElementById("removePhotoBtn")
    ?.addEventListener("click", handleRemovePhoto);
  document
    .getElementById("signOutBtn")
    .addEventListener("click", handleSignOut);
  document
    .getElementById("deleteConfirmBtn")
    .addEventListener("click", handleDeleteConfirmation);
  document
    .getElementById("deleteCancelBtn")
    .addEventListener("click", showMainMenu);

  document
    .getElementById("favorite-style-btn")
    .addEventListener("click", () => showPreferencePopup("style"));
  document
    .getElementById("favorite-color-btn")
    .addEventListener("click", () => showPreferencePopup("color"));
  document
    .getElementById("styles-to-try-btn")
    .addEventListener("click", () => showPreferencePopup("try"));
}

function showSection(sectionId) {
  console.log("[v0] Showing section:", sectionId);
  mainMenu.style.display = "none";
  contentArea.style.display = "block";

  allSections.forEach((section) => section.classList.remove("active"));

  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add("active");
    populateSectionData(sectionId);

    if (sectionId === "liked-section") {
      console.log("[v0] Initializing liked items...");
      initializeLikedItems(userProfile);
    }
  }
}

function showMainMenu() {
  mainMenu.style.display = "flex";
  contentArea.style.display = "none";
  allSections.forEach((section) => section.classList.remove("active"));
}

function populateSectionData(sectionId) {
  if (!userProfile) return;
  console.log("[v0] Populating section data for:", sectionId);

  switch (sectionId) {
    case "edit-section":
      document.getElementById("username").value = userProfile.displayName || "";
      document.getElementById("address").value =
        userProfile.location?.address || "";
      document.getElementById("profilePhotoPreview").src =
        userProfile.profileImageUrl || "https://via.placeholder.com/150";
      break;
    case "preference-section":
      const prefs = userProfile.personalization || {};
      document.getElementById("pref-height").value = prefs.height || "";
      document.getElementById("pref-weight").value = prefs.weight || "";
      document.getElementById("pref-gender").value = prefs.gender || "";

      favoriteStyles = prefs.favoriteStyles || [];
      favoriteColors = prefs.favoriteColors || [];
      stylesToTry = prefs.stylesToTry || [];
      break;
  }
}

async function handleUpdateProfile() {
  const newUsername = document.getElementById("username").value.trim();
  const newAddress = document.getElementById("address").value.trim();

  if (!newUsername || !newAddress) {
    showModal("Validation Error", "Username and address cannot be empty.");
    return;
  }

  try {
    console.log("[v0] Geocoding address:", newAddress);
    const newGeopoint = await geocodeAddress(newAddress);

    if (!newGeopoint) {
      showModal(
        "Address Error",
        "Could not verify the address. Please try again."
      );
      return;
    }

    const updates = {
      displayName: newUsername,
      "location.address": newAddress,
      "location.geopoint": newGeopoint,
    };

    await profileService.updateUserProfile(updates);

    userProfile.displayName = newUsername;
    userProfile.location = { address: newAddress, geopoint: newGeopoint };

    showModal("Success", "Your profile has been updated.");
    showMainMenu();
  } catch (error) {
    console.error("[v0] Update profile error:", error);
    showModal("Error", "Could not save your changes. Please try again.");
  }
}

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    console.log("[v0] Uploading photo...");
    const downloadURL = await profileService.uploadProfilePhoto(file);
    await profileService.updateUserProfile({ profileImageUrl: downloadURL });

    userProfile.profileImageUrl = downloadURL;
    document.getElementById("profilePhotoPreview").src = downloadURL;

    showModal("Success", "Your profile photo has been updated.");
  } catch (error) {
    console.error("[v0] Photo upload error:", error);
    showModal("Error", "Could not update your photo. Please try again.");
  }
}

async function handleRemovePhoto() {
  try {
    await profileService.updateUserProfile({ profileImageUrl: "" });
    userProfile.profileImageUrl = "";
    document.getElementById("profilePhotoPreview").src =
      "https://via.placeholder.com/150";
    showModal("Success", "Profile photo removed.");
  } catch (error) {
    console.error("[v0] Remove photo error:", error);
    showModal("Error", "Could not remove photo.");
  }
}

async function handleUpdatePreferences(event) {
  event.preventDefault();

  const updates = {
    "personalization.height": document.getElementById("pref-height").value,
    "personalization.weight": document.getElementById("pref-weight").value,
    "personalization.gender": document.getElementById("pref-gender").value,
    "personalization.favoriteStyles": favoriteStyles,
    "personalization.favoriteColors": favoriteColors,
    "personalization.stylesToTry": stylesToTry,
  };

  try {
    await profileService.updateUserProfile(updates);

    if (!userProfile.personalization) userProfile.personalization = {};
    Object.assign(userProfile.personalization, {
      height: updates["personalization.height"],
      weight: updates["personalization.weight"],
      gender: updates["personalization.gender"],
      favoriteStyles: favoriteStyles,
      favoriteColors: favoriteColors,
      stylesToTry: stylesToTry,
    });

    showModal("Success", "Your preferences have been saved.");
    showMainMenu();
  } catch (error) {
    console.error("[v0] Update preferences error:", error);
    showModal("Error", "Could not save your preferences. Please try again.");
  }
}

async function handleChangePassword(event) {
  event.preventDefault();

  const currentPass = document.getElementById("current-password").value;
  const newPass = document.getElementById("new-password").value;

  if (!currentPass || newPass.length < 6) {
    showModal(
      "Validation Error",
      "Please provide your current password and a new password of at least 6 characters."
    );
    return;
  }

  try {
    await profileService.updateUserPassword(currentPass, newPass);
    document.getElementById("securityForm").reset();
    showModal("Success", "Your password has been changed.");
    showMainMenu();
  } catch (error) {
    console.error("[v0] Password change error:", error);
    if (error.code === "auth/wrong-password") {
      showModal("Error", "Incorrect password. Please try again.");
    } else {
      showModal("Error", "Could not change password. Please try again later.");
    }
  }
}

function handleDeleteConfirmation() {
  showModal(
    "Delete Account",
    "Deleting your account is permanent and cannot be undone. All your data will be deleted. Are you sure you want to proceed?",
    {
      confirmText: "DELETE",
      cancelText: "CANCEL",
      iconType: "delete",
      onConfirm: async () => {
        showModal(
          "Confirm Password",
          "Please enter your password to confirm account deletion:",
          {
            confirmText: "DELETE ACCOUNT",
            cancelText: "CANCEL",
            inputPlaceholder: "Enter your password",
            inputType: "password",
            onConfirm: async (password) => {
              if (!password || password.trim() === "") {
                showModal(
                  "Error",
                  "Password is required to delete your account."
                );
                return;
              }

              try {
                console.log("[v0] Deleting account...");
                await profileService.deleteUserAccount(password);

                showModal(
                  "Account Deleted",
                  "Your account has been permanently deleted.",
                  {
                    confirmText: "OK",
                    onConfirm: () => {
                      window.location.href = "./auth-login-customer.html";
                    },
                  }
                );
              } catch (error) {
                console.error("[v0] Account deletion error:", error);
                if (error.code === "auth/wrong-password") {
                  showModal("Error", "Incorrect password. Please try again.");
                } else {
                  showModal(
                    "Error",
                    "Could not delete your account. Please try again later."
                  );
                }
              }
            },
            onCancel: () => {
              console.log("[v0] Account deletion cancelled");
            },
          }
        );
      },
      onCancel: () => {
        console.log("[v0] Account deletion cancelled");
      },
    }
  );
}

function handleSignOut() {
  showModal("Sign Out", "Are you sure you want to sign out?", {
    confirmText: "SIGN OUT",
    cancelText: "CANCEL",
    onConfirm: () => {
      signOut(auth)
        .then(() => {
          console.log("[v0] User signed out.");
          window.location.href = "./auth-login-customer.html";
        })
        .catch((error) => {
          console.error("[v0] Sign out error:", error);
          showModal("Error", "Could not sign you out. Please try again.");
        });
    },
  });
}

function showPreferencePopup(type) {
  let title, options, selectedValues;

  if (type === "style") {
    title = "Select your favorite style";
    options = [
      "Casual",
      "Formal",
      "Business",
      "Party",
      "Dressy",
      "Vintage",
      "Street Style",
      "Minimalist",
      "Sporty",
      "Elegant",
      "Preppy",
      "Y2K",
    ];
    selectedValues = favoriteStyles;
  } else if (type === "color") {
    title = "Select your favorite color";
    options = [
      "Black",
      "White",
      "Grey",
      "Beige",
      "Brown",
      "Navy",
      "Red",
      "Pink",
      "Orange",
      "Yellow",
      "Green",
      "Blue",
      "Purple",
    ];
    selectedValues = favoriteColors;
  } else if (type === "try") {
    title = "Select styles you want to try";
    options = [
      "Casual",
      "Formal",
      "Business",
      "Party",
      "Dressy",
      "Vintage",
      "Street Style",
      "Minimalist",
      "Sporty",
      "Elegant",
      "Preppy",
      "Y2K",
    ];
    selectedValues = stylesToTry;
  }

  const popup = document.createElement("div");
  popup.className = "preference-popup-overlay active";
  popup.innerHTML = `
    <div class="preference-popup-content">
      <h3>${title}</h3>
      <div class="preference-options-grid">
        ${options
      .map(
        (opt) => `
          <button 
            class="preference-option-item ${type === "color" ? "color" : "style"
          } ${opt.toLowerCase()} ${selectedValues.includes(opt) ? "active" : ""
          }" 
            data-value="${opt}"
          >
            ${opt}
          </button>
        `
      )
      .join("")}
      </div>
      <div class="preference-popup-actions">
        <button class="preference-popup-save">Save</button>
        <button class="preference-popup-cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  popup.querySelectorAll(".preference-option-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });

  popup
    .querySelector(".preference-popup-save")
    .addEventListener("click", () => {
      const selected = Array.from(
        popup.querySelectorAll(".preference-option-item.active")
      ).map((btn) => btn.dataset.value);

      if (type === "style") {
        favoriteStyles = selected;
      } else if (type === "color") {
        favoriteColors = selected;
      } else if (type === "try") {
        stylesToTry = selected;
      }

      popup.remove();
    });

  // Cancel
  popup
    .querySelector(".preference-popup-cancel")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      popup.remove();
    });

  // Click overlay to close
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.remove();
    }
  });
}

/* ============================
   MOBILE SUBMENU CLICK HANDLERS
   ============================ */
document.addEventListener("click", (e) => {
  const row = e.target.closest(".submenu-item");
  if (!row) return;

  const targetSection = row.dataset.target;
  if (!targetSection) return;

  mainMenu.style.display = "none";
  contentArea.style.display = "block";

  allSections.forEach((section) => section.classList.remove("active"));

  const targetEl = document.getElementById(targetSection);
  if (targetEl) {
    targetEl.classList.add("active");
    populateSectionData(targetSection);

    if (targetSection === "liked-section") {
      initializeLikedItems(userProfile);
    }
  }
});
