/*
  @Revise By: Bella
 */
import { authService } from "../../../services/business-side/AuthService.js";
import { profileService } from "../../../services/business-side/ProfileService.js";
import { showModal } from "../../controller/components/modal.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const loginButton = loginForm.querySelector(".login-btn");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) {
      emailError.textContent = "Please enter your email.";
      return;
    }
    if (!password) {
      passwordError.textContent = "Please enter your password.";
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "LOGGING IN...";

    try {
      const userCredential = await authService.signIn(email, password);
      const user = userCredential.user;

      console.log("Login successful. Fetching profile to cache...");

      const profile = await profileService.getProfileByUID(user.uid);

      if (profile) {
        let userRole = "customer";

        if (
          profile.roles?.includes("business") ||
          profile.role === "business"
        ) {
          userRole = "business";
        }
        let displayName = profile.displayName;
        console.log(`userRole`);
        console.log(displayName);
        if (userRole === "customer") {
          displayName = profile.displayName;
        }

        localStorage.setItem("userDisplayName", displayName);
        localStorage.setItem("userRole", userRole);
        console.log(`Cached user: ${displayName}, Role: ${userRole}`);
      }

      console.log("Redirecting to business home page...");
      if (localStorage.getItem("userRole") === "customer") {
        window.location.href = "../../customer-side/pages/c-main-home.html";
        console.log("Customer");
      } else if (localStorage.getItem("userRole") === "business") {
        console.log("ATOOO");
        throw {
          code: "auth/business-redirect",
          message: "Business Account Detected",
        };
      }
    } catch (error) {
      console.error("Login failed:", error);

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        emailError.textContent = "No account found with this email.";
        showModal(
          "Login Failed",
          "Either your email or the password is incorrect",
          {
            iconType: "warning",
            confirmText: "OK",
          }
        );
      } else if (error.code === "auth/wrong-password") {
        passwordError.textContent = "Incorrect password. Please try again.";
        showModal(
          "Login Failed",
          "The password you entered is incorrect. Please try again.",
          {
            iconType: "warning",
            confirmText: "OK",
          }
        );
      } else if (error.code === "auth/business-redirect") {
        emailError.textContent = "Business Account Detected";
        showModal(
          "Login Failed",
          "You are at the customer login side, use the business login.",
          {
            iconType: "warning",
            confirmText: "OK",
          }
        );
      } else {
        console.log("IGGGAA");
        console.log(error);
        showModal(
          "Login Failed",
          "An unexpected error occurred. Please check your connection and try again.",
          {
            iconType: "warning",
            confirmText: "OK",
          }
        );
      }
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "LOG IN";
    }
  });
});
