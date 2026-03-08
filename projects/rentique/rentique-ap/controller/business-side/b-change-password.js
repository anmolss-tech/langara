/*
  @Made By: 
 */
import { auth } from "../../../services/business-side/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { authService } from "../../../services/business-side/AuthService.js";
import { showModal } from "../../controller/components/modal.js";

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initializeApp();
    } else {
      console.log("No user logged in. Redirecting to login.");
      window.location.href = "./auth-login-business.html";
    }
  });
});

function initializeApp() {
  const elements = {
    form: document.querySelector(".change-password-form form"),
    currentPasswordInput: document.getElementById("currentPassword"),
    newPasswordInput: document.getElementById("newPassword"),
    saveButton: document.querySelector(".change-password-form .save-btn"),
  };

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlePasswordChange(elements);
  });
}

async function handlePasswordChange(elements) {
  const currentPassword = elements.currentPasswordInput.value;
  const newPassword = elements.newPasswordInput.value;
  
  if (!currentPassword || !newPassword) {
    showModal("Validation Error", "Please fill in both password fields.", { 
        iconType: 'warning', 
        confirmText: 'OK' 
    });
    return;
  }
  if (newPassword.length < 6) {
    showModal("Validation Error", "Your new password must be at least 6 characters long.", { 
        iconType: 'warning', 
        confirmText: 'OK' 
    });
    return;
  }

  elements.saveButton.disabled = true;
  elements.saveButton.textContent = "SAVING...";

  try {
    await authService.changePassword(currentPassword, newPassword);
    showModal("Success!", "Your password has been updated successfully.", {
        confirmText: 'OK',
        onConfirm: () => {
            elements.form.reset();
        }
    });

  } catch (error) {
    console.error("Password change failed:", error);
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      showModal("Error", "The current password you entered is incorrect. Please try again.", { 
          iconType: 'warning', 
          confirmText: 'Try Again' 
        });
    } else if (error.code === "auth/weak-password") {
      showModal("Password Too Weak", "The new password is not strong enough. It must be at least 6 characters.", { 
          iconType: 'warning', 
          confirmText: 'OK' 
        });
    } else {
      showModal("Authentication Failed", "Password provided is incorrect. Could not change your password.", { 
          iconType: 'warning', 
          confirmText: 'OK' 
        });
    }
  } finally {
    elements.saveButton.disabled = false;
    elements.saveButton.textContent = "SAVE";
  }
}