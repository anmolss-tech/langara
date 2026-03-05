/*
  @Made By: 
 */
import { auth, storage } from "../../../services/business-side/firebase-init.js";
import { authService } from "../../../services/business-side/AuthService.js";
import { profileService } from "../../../services/business-side/ProfileService.js";
import { showModal } from "../../controller/components/modal.js";
import { geocodeAddress } from "../../../services/business-side/Geocoding.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

async function urlToFile(url, filename, mimeType) {
    try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        return new File([buf], filename, { type: mimeType });
    } catch (e) {
        console.error("Error converting URL to file:", e);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupBusinessForm");
    if (!form) {
        console.warn("[signup-business.js] - 'signupBusinessForm' not found. Script will not execute.");
        return;
    }

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const policyCheckbox = document.getElementById("policyAccept");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const submitButton = form.querySelector('button[type="submit"]');

    const brandInfoModal = document.getElementById("brandInfoModal");
    const brandLogoInput = document.getElementById("brandLogo");
    const brandLogoPreview = document.getElementById("brandLogoPreview");
    const removeBrandLogoBtn = document.getElementById("removeBrandLogo");
    const photoPlaceholder = document.querySelector(".photo-placeholder");
    const brandNameInput = document.getElementById("brandName");
    const brandAddressInput = document.getElementById("brandAddress");
    const completeBrandInfoBtn = document.getElementById("completeBrandInfo");
    let uploadedBrandLogoFile = null;

    form.addEventListener('autopopulate-business-signup', async (e) => {
        console.log('Received autopopulate-business-signup event:', e.detail);
        const data = e.detail;

        if (emailInput) {
            emailInput.value = data.email;
            emailInput.dispatchEvent(new Event('input'));
            emailInput.dispatchEvent(new Event('blur')); 
        }
        if (passwordInput) {
            passwordInput.value = data.password;
            passwordInput.dispatchEvent(new Event('input'));
            passwordInput.dispatchEvent(new Event('blur'));
        }
        if (policyCheckbox) {
            policyCheckbox.checked = true;
            policyCheckbox.dispatchEvent(new Event('change'));
        }

        if (brandNameInput) {
            brandNameInput.value = data.brandName;
            brandNameInput.dispatchEvent(new Event('input'));
        }
        if (brandAddressInput) {
            brandAddressInput.value = data.brandAddress;
            brandAddressInput.dispatchEvent(new Event('input'));
        }

        if (data.brandLogoUrl) {
            const file = await urlToFile(data.brandLogoUrl, "brand-logo.png", "image/png");
            if (file) {
                uploadedBrandLogoFile = file;
                
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (brandLogoPreview) {
                        brandLogoPreview.src = ev.target.result;
                        brandLogoPreview.style.display = "block";
                    }
                    if (removeBrandLogoBtn) removeBrandLogoBtn.style.display = "block";
                    if (photoPlaceholder) photoPlaceholder.style.display = "none";
                };
                reader.readAsDataURL(file);
                
                checkBrandInfoCompletion();
            }
        }
    });

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function validatePassword(password) {
        return password.length >= 8;
    }

    if (emailInput) {
        emailInput.addEventListener("blur", () => {
            if (!emailInput.value) {
                if (emailError) emailError.textContent = "Email is required";
                emailInput.classList.add("error");
            } else if (!validateEmail(emailInput.value)) {
                if (emailError) emailError.textContent = "Please enter a valid email";
                emailInput.classList.add("error");
            }
        });
        emailInput.addEventListener("input", () => {
            if (emailError) emailError.textContent = "";
            emailInput.classList.remove("error");
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("blur", () => {
            if (!passwordInput.value) {
                if (passwordError) passwordError.textContent = "Password is required";
                passwordInput.classList.add("error");
            } else if (!validatePassword(passwordInput.value)) {
                if (passwordError) passwordError.textContent = "Password must be at least 8 characters";
                passwordInput.classList.add("error");
            }
        });
        passwordInput.addEventListener("input", () => {
            if (passwordError) passwordError.textContent = "";
            passwordInput.classList.remove("error");
        });
    }

    if (policyCheckbox) {
        submitButton.disabled = !policyCheckbox.checked;
        policyCheckbox.addEventListener("change", () => {
            submitButton.disabled = !policyCheckbox.checked;
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        
        let isValid = true;
        if (!validateEmail(email)) {
            isValid = false;
            if(emailError) emailError.textContent = "Please enter a valid email";
        }
        if (!validatePassword(password)) {
            isValid = false;
            if(passwordError) passwordError.textContent = "Password must be at least 8 characters";
        }
        if (!isValid) return;

        submitButton.disabled = true;
        submitButton.textContent = "PROCESSING...";
 
        try {
            await authService.signUp(email, password, "business");
            document.querySelector(".left").style.display = "none";
            brandInfoModal.style.display = "flex";

        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                const profile = await profileService.getProfileByEmail(email);

                let userExist = false;
                for(let key in profile){
                    if(key == "roles"){
                        userExist = (profile.roles.includes('business')) ? true : false;
                    }else if(key == "role"){
                        userExist = ([profile.role].includes('business')) ? true : false;
                    }
                }

                if (userExist) {
                       const errorMessage = 'This email is already registered as a business. Please Log In.';
                        showModal('Already Registered', errorMessage, { 
                            iconType: 'warning', 
                            confirmText: 'OK' 
                        });
                    if (emailError) emailError.textContent = errorMessage;
                } else {
                    showModal(
                        'Account Exists',
                        'This email is already registered. To add a business profile, please enter your password to confirm.',
                        {
                            inputType: 'password',
                            confirmText: 'Confirm',
                            onConfirm: async (existingPassword) => {
                                if (existingPassword) { 
                                    try {
                                        const userCredential = await authService.signIn(email, existingPassword);
                                        await authService.addRoleToExistingUser(userCredential.user.uid, "business");
                                        
                                        showModal('Success!', 'Business role added. Please complete your brand information.', { confirmText: 'Continue' });
                                        
                                        document.querySelector(".left").style.display = "none";
                                        brandInfoModal.style.display = "flex";

                                    } catch (signInError) {
                                        showModal('Verification Failed', 'The password you entered was incorrect. Please try again.', { iconType: 'warning' });
                                        if(emailError) emailError.textContent = "Password verification failed.";
                                    }
                                } else { 
                                    if(emailError) emailError.textContent = "Sign-up cancelled.";
                                }
                            }
                        }
                    );
                }
            } else {
                showModal('Sign-Up Failed', error.message, { iconType: 'warning' });
            }

            submitButton.disabled = !policyCheckbox.checked;
            submitButton.textContent = "CREATE ACCOUNT";
        }
    });

    if (brandLogoInput) {
        brandLogoInput.addEventListener("change", (e) => {
            uploadedBrandLogoFile = e.target.files[0];
            if (uploadedBrandLogoFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    brandLogoPreview.src = e.target.result;
                    brandLogoPreview.style.display = "block";
                    removeBrandLogoBtn.style.display = "block";
                    if(photoPlaceholder) photoPlaceholder.style.display = "none";
                };
                reader.readAsDataURL(uploadedBrandLogoFile);
            }
            checkBrandInfoCompletion();
        });
    }

    if (removeBrandLogoBtn) {
        removeBrandLogoBtn.addEventListener("click", () => {
            uploadedBrandLogoFile = null;
            brandLogoInput.value = "";
            brandLogoPreview.style.display = "none";
            brandLogoPreview.src = "";
            removeBrandLogoBtn.style.display = "none";
            if (photoPlaceholder) photoPlaceholder.style.display = "flex";
            checkBrandInfoCompletion();
        });
    }

    function checkBrandInfoCompletion() {
        if (completeBrandInfoBtn) {
            const hasLogo = uploadedBrandLogoFile !== null;
            const hasBrandName = brandNameInput.value.trim() !== "";
            const hasAddress = brandAddressInput.value.trim() !== "";
            completeBrandInfoBtn.disabled = !(hasLogo && hasBrandName && hasAddress);
        }
    }
    if (brandNameInput) brandNameInput.addEventListener("input", checkBrandInfoCompletion);
    if (brandAddressInput) brandAddressInput.addEventListener("input", checkBrandInfoCompletion);

    if (completeBrandInfoBtn) {
        completeBrandInfoBtn.addEventListener("click", async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showModal('Error', 'No user is signed in. Please refresh and try again.', { iconType: 'warning', confirmText: 'OK' });
                return;
            }

            completeBrandInfoBtn.disabled = true;
            completeBrandInfoBtn.textContent = "SAVING...";

            try {
                let brandLogoUrl = null;
                if (uploadedBrandLogoFile) {
                    const storageRef = ref(storage, `brand_logos/${currentUser.uid}/${uploadedBrandLogoFile.name}`);
                    const snapshot = await uploadBytes(storageRef, uploadedBrandLogoFile);
                    brandLogoUrl = await getDownloadURL(snapshot.ref);
                }
                const addressString = brandAddressInput.value;
                const addressNodes = await geocodeAddress(addressString);
                console.log("Address: ");
                console.log(addressNodes);
                const businessData = {
                    businessName: brandNameInput.value,
                    brandImageUrl: brandLogoUrl,
                    location: {
                        address: addressString,
                        geopoint: addressNodes
                    }
                };

                await profileService.createBusiness(currentUser.uid, businessData);
                
                window.location.href = "./b-home.html";

            } catch (error) {
                showModal('Save Failed', error.message, { iconType: 'warning', confirmText: 'OK' });
                completeBrandInfoBtn.disabled = false;
                completeBrandInfoBtn.textContent = "DONE";
            }
        });
    }
});