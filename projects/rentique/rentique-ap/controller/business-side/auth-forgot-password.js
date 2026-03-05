// @Made By: Dalbir Singh
import { authService } from '../../../services/business-side/AuthService.js';
import { modalService } from '../../../services/business-side/ModalService.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  if (!form) {
    console.warn("[auth-forgot-password.js] - 'forgotPasswordForm' not found. Script will not run.");
    return;
  }

  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  emailInput.addEventListener("blur", () => {
    if (!emailInput.value) {
      emailError.textContent = "Email is required";
      emailInput.classList.add("error");
    } else if (!validateEmail(emailInput.value)) {
      emailError.textContent = "Please enter a valid email";
      emailInput.classList.add("error");
    }
  });

  emailInput.addEventListener("input", () => {
    if (emailError.textContent) {
      emailError.textContent = "";
      emailInput.classList.remove("error");
    }
  });
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    
    if (!email || !validateEmail(email)) {
      emailError.textContent = "Please enter a valid email";
      emailInput.classList.add("error");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      submitButton.disabled = true;
      submitButton.textContent = "SENDING...";

      console.log("[auth-forgot-password.js] - Calling AuthService.sendPasswordReset.");
      await authService.sendPasswordReset(email);

      await modalService.showAlert(
          'Check Your Email', 
          `If an account exists for ${email}, a password reset link has been sent.`
      );
      window.location.href = "auth-login-customer.html";

    } catch (error) {
      console.error("[forgot-password.js] - Failed to send reset email:", error);
      await modalService.showAlert(
          'Check Your Email', 
          `If an account exists for ${email}, a password reset link has been sent.`
      );
      window.location.href = "auth-login-customer.html";
    }
  });
});