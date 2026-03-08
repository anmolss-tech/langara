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
    const signupForm = document.getElementById("signupForm");
    if (!signupForm) { 
        console.warn("[signup-customer.js] - 'signupForm' not found. Script will not run.");
        return; 
    }
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const policyCheckbox = document.getElementById("policyAccept");
    const generalError = document.getElementById("generalError");
    const submitButton = signupForm.querySelector('button[type="submit"]');

    const userProfileModal = document.getElementById("userProfileModal");
    const usernameInput = document.getElementById("username");
    const addressInput = document.getElementById("address");
    const profilePhotoInput = document.getElementById("profilePhoto");
    const profilePreview = document.getElementById("profilePreview");
    const photoPlaceholder = userProfileModal.querySelector(".photo-placeholder");
    const continueToQuestionnaireBtn = document.getElementById("continueToQuestionnaire");
    const removeProfilePhotoBtn = document.getElementById("removeProfilePhotoBtn");
    let uploadedProfilePhotoFile = null;

    const questionnaireModal = document.getElementById("questionnaireModal");
    const questionnaireSteps = document.querySelectorAll(".questionnaire-step");
    const progressSteps = document.querySelectorAll(".progress-step");
    const continueButtons = document.querySelectorAll(".questionnaire-continue");
    const backButtons = document.querySelectorAll(".questionnaire-back");
    const doneButton = document.querySelector(".questionnaire-done");
    let currentStep = 1;
    
    // --- Auto Populate Logic ---
    signupForm.addEventListener('autopopulate-data', async (e) => {
        console.log('Received autopopulate-data event (Customer):', e.detail);
        const data = e.detail;

        // 1. Fill Signup Form
        if(emailInput) {
            emailInput.value = data.email;
            emailInput.dispatchEvent(new Event('input'));
            emailInput.dispatchEvent(new Event('blur'));
        }
        if(passwordInput) {
            passwordInput.value = data.password;
            passwordInput.dispatchEvent(new Event('input'));
            passwordInput.dispatchEvent(new Event('blur'));
        }
        if(policyCheckbox) {
            policyCheckbox.checked = true;
            policyCheckbox.dispatchEvent(new Event('change')); 
        }

       
        if(usernameInput) {
            usernameInput.value = data.username;
            usernameInput.dispatchEvent(new Event('input'));
        }
        if(addressInput) {
            addressInput.value = data.address;
            addressInput.dispatchEvent(new Event('input'));
        }
       
        if (data.profileImageUrl) {
            const file = await urlToFile(data.profileImageUrl, "profile-pic.jpg", "image/jpeg");
            if (file) {
                uploadedProfilePhotoFile = file;
                
                const reader = new FileReader();
                reader.onload = (ev) => {
                    profilePreview.src = ev.target.result;
                    updatePhotoUI(true);
                };
                reader.readAsDataURL(file);
                
                
                checkProfileCompletion();
            }
        }

      
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        
        if (heightInput) heightInput.value = data.height;
        if (weightInput) weightInput.value = data.weight;

      
        const check = (name, values) => {
            document.querySelectorAll(`input[name="${name}"]`).forEach(i => {
                const isMatch = Array.isArray(values) ? values.includes(i.value) : values === i.value;
                if (isMatch) {
                    i.checked = true;
                    i.dispatchEvent(new Event('change')); 
                }
            });
        };

        check("gender", data.gender);
        check("favoriteColor", data.favoriteColors);
        check("favoriteStyle", data.favoriteStyles);
        check("styleToTry", data.stylesToTry);
        
       
        if (heightInput) heightInput.dispatchEvent(new Event('input'));
        if (weightInput) weightInput.dispatchEvent(new Event('input'));
    });
  
    const cameraButton = document.getElementById("cameraButton");
    const cameraModal = document.getElementById("cameraModal");
    const cameraFeed = document.getElementById("cameraFeed");
    const cameraCanvas = document.getElementById("cameraCanvas");
    const captureButton = document.getElementById("captureButton");
    const cancelCameraButton = document.getElementById("cancelCameraButton");
    let stream = null;
    
   
    async function startCamera() {
       
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'https:') {
             showModal("Secure Connection Required", "Camera access requires a secure (HTTPS) connection or localhost.", { isDanger: true });
             return;
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
               
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                cameraFeed.srcObject = stream;
                cameraModal.classList.add("active");
            } catch (error) {
                console.warn("Specific camera constraints failed, trying generic...", error);
                try {
                    
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    cameraFeed.srcObject = stream;
                    cameraModal.classList.add("active");
                } catch (fallbackError) {
                    console.error("Camera access error:", fallbackError);
                    let msg = "Could not access the camera.";
                    
                   
                    if (fallbackError.name === 'NotAllowedError') msg = "Permission denied. Please allow camera access in your browser settings.";
                    if (fallbackError.name === 'NotFoundError') msg = "No camera found on this device.";
                    if (fallbackError.name === 'NotReadableError') msg = "Camera is currently in use by another application.";
                    
                    showModal("Camera Error", msg, { isDanger: true });
                }
            }
        } else {
            showModal("Unsupported", "Your browser does not support camera access.", { isDanger: true });
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        cameraModal.classList.remove("active");
    }

    function captureImage() {
        const context = cameraCanvas.getContext("2d");
        cameraCanvas.width = cameraFeed.videoWidth;
        cameraCanvas.height = cameraFeed.videoHeight;
        context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);

        cameraCanvas.toBlob((blob) => {
            const fileName = `profile-${Date.now()}.jpg`;
            uploadedProfilePhotoFile = new File([blob], fileName, { type: "image/jpeg" });
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.src = e.target.result;
                updatePhotoUI(true);
            };
            reader.readAsDataURL(uploadedProfilePhotoFile);
            
            checkProfileCompletion();
        }, "image/jpeg");

        stopCamera();
    }

    function updatePhotoUI(hasPhoto) {
        if (hasPhoto) {
            profilePreview.style.display = "block";
            if(removeProfilePhotoBtn) removeProfilePhotoBtn.style.display = "flex";
            if(photoPlaceholder) photoPlaceholder.style.display = "none";
            if(cameraButton) cameraButton.style.display = "none";
        } else {
            profilePreview.src = "";
            profilePreview.style.display = "none";
            if(removeProfilePhotoBtn) removeProfilePhotoBtn.style.display = "none";
            if(photoPlaceholder) photoPlaceholder.style.display = "flex";
            if(cameraButton) cameraButton.style.display = "flex";
            profilePhotoInput.value = "";
        }
    }
    
    if (cameraButton) cameraButton.addEventListener("click", startCamera);
    if (captureButton) captureButton.addEventListener("click", captureImage);
    if (cancelCameraButton) cancelCameraButton.addEventListener("click", stopCamera);
    
    if (removeProfilePhotoBtn) {
        removeProfilePhotoBtn.addEventListener("click", () => {
            uploadedProfilePhotoFile = null;
            updatePhotoUI(false);
            checkProfileCompletion();
        });
    }

    function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    function validatePassword(password) { return password.length >= 8; }

    if (policyCheckbox) {
        submitButton.disabled = !policyCheckbox.checked;
        policyCheckbox.addEventListener("change", () => { submitButton.disabled = !policyCheckbox.checked; });
    }

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        
        if (!validateEmail(email) || !validatePassword(password)) {
            if(generalError) generalError.textContent = "Please provide a valid email and a password of at least 8 characters.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "CREATING...";

        try {
            await authService.signUp(email, password, 'customer');
            
            document.querySelector(".left").style.display = "none";
            if (document.querySelector(".right")) document.querySelector(".right").style.display = "none";
            userProfileModal.style.display = "flex";

        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                const profile = await profileService.getProfileByEmail(email);

                let userExist = false;
                for(let key in profile){
                    if(key == "roles"){
                        userExist = (profile.roles.includes('customer')) ? true : false;
                    }else if(key == "role"){
                        userExist = ([profile.role].includes('customer')) ? true : false;
                    }
                }  
                
                if (userExist) {
                    const errorMessage = 'This email is already registered as a customer. Please Log In.';
                    showModal('Already Registered', errorMessage, { iconType: 'warning', confirmText: 'OK' });
                    if (generalError) generalError.textContent = errorMessage;
                } else {
                    showModal(
                        'Account Exists',
                        'This email is already registered. To use it as a customer, please enter your password to confirm.',
                        {
                            inputType: 'password',
                            confirmText: 'Confirm',
                            onConfirm: async (existingPassword) => {
                                if (existingPassword) {
                                    try {
                                        const userCredential = await authService.signIn(email, existingPassword);
                                        await authService.addRoleToExistingUser(userCredential.user.uid, "customer");
                                        
                                        showModal('Success!', 'Customer role added. Please complete your profile.', { confirmText: 'Continue' });
                                        
                                        document.querySelector(".left").style.display = "none";
                                        if (document.querySelector(".right")) document.querySelector(".right").style.display = "none";
                                        userProfileModal.style.display = "flex";
                                    } catch (signInError) {
                                        showModal('Verification Failed', 'The password you entered was incorrect.', { iconType: 'warning' });
                                        if(generalError) generalError.textContent = "Password verification failed.";
                                    }
                                } else {
                                    if(generalError) generalError.textContent = "Sign-up cancelled.";
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

    if (profilePhotoInput) {
        profilePhotoInput.addEventListener("change", (e) => {
            uploadedProfilePhotoFile = e.target.files[0];
            if (uploadedProfilePhotoFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePreview.src = e.target.result;
                    updatePhotoUI(true);
                };
                reader.readAsDataURL(uploadedProfilePhotoFile);
            }
            checkProfileCompletion();
        });
    }

    function checkProfileCompletion() {
        if(continueToQuestionnaireBtn){
            continueToQuestionnaireBtn.disabled = !(usernameInput.value.trim() && addressInput.value.trim() && uploadedProfilePhotoFile);
        }
    }
    if(usernameInput) usernameInput.addEventListener("input", checkProfileCompletion);
    if(addressInput) addressInput.addEventListener("input", checkProfileCompletion);

    if (continueToQuestionnaireBtn) {
        continueToQuestionnaireBtn.addEventListener("click", async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) { return showModal('Error', 'No user is signed in.', { iconType: 'warning' }); }

            continueToQuestionnaireBtn.disabled = true;
            continueToQuestionnaireBtn.textContent = "SAVING...";

            try {
                let profilePhotoUrl = null;
                if (uploadedProfilePhotoFile) {
                    const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${uploadedProfilePhotoFile.name}`);
                    const snapshot = await uploadBytes(storageRef, uploadedProfilePhotoFile);
                    profilePhotoUrl = await getDownloadURL(snapshot.ref);
                }
                
                const addressString = addressInput.value;
                const addressNodes = await geocodeAddress(addressString);

                const profileData = {
                    displayName: usernameInput.value,
                    location: {
                        address: addressString,
                        geopoint: addressNodes
                    },
                    profileImageUrl: profilePhotoUrl
                };

                await profileService.updateProfile(currentUser.uid, profileData);
                
                document.getElementById("userProfileModal").style.display = "none";
                document.getElementById("questionnaireModal").style.display = "flex";
                showStep(1);

            } catch (error) {
                showModal('Save Failed', error.message, { iconType: 'warning' });
                continueToQuestionnaireBtn.disabled = false;
                continueToQuestionnaireBtn.textContent = "Continue";
            }
        });
    }
    
    const questionnaireBackToProfile = document.querySelector('.questionnaire-back-to-profile');
    if (questionnaireBackToProfile) {
        questionnaireBackToProfile.addEventListener('click', (e) => {
            e.preventDefault();
            questionnaireModal.style.display = 'none';
            userProfileModal.style.display = 'flex';
        });
    }

    function checkQuestionnaireStepCompletion(stepNumber) {
        const currentStepElement = document.querySelector(`.questionnaire-step[data-step="${stepNumber}"]`);
        if (!currentStepElement) return;

        const continueBtn = currentStepElement.querySelector('.questionnaire-continue');
        if (!continueBtn) return; // This handles the last step which has a "DONE" button

        let isStepComplete = false;

        switch (stepNumber) {
            case 1:
                const heightFilled = document.getElementById('height').value.trim() !== '';
                const weightFilled = document.getElementById('weight').value.trim() !== '';
                const genderSelected = document.querySelector('input[name="gender"]:checked');
                isStepComplete = heightFilled && weightFilled && !!genderSelected;
                break;
            case 2:
                const colorSelected = document.querySelectorAll('input[name="favoriteColor"]:checked').length > 0;
                isStepComplete = colorSelected;
                break;
            case 3:
                const styleSelected = document.querySelectorAll('input[name="favoriteStyle"]:checked').length > 0;
                isStepComplete = styleSelected;
                break;
        }
        
        continueBtn.disabled = !isStepComplete;
    }

    function showStep(stepNumber) {
        questionnaireSteps.forEach(step => {
            step.style.display = step.dataset.step == stepNumber ? 'block' : 'none';
        });
        progressSteps.forEach(step => {
            step.classList.toggle('active', step.dataset.step <= stepNumber);
        });
        currentStep = stepNumber;
        checkQuestionnaireStepCompletion(currentStep);

    }
    const allQuestionnaireInputs = questionnaireModal.querySelectorAll('input');
    allQuestionnaireInputs.forEach(input => {
        const eventType = (input.type === 'text' || input.type === 'number') ? 'input' : 'change';
        input.addEventListener(eventType, () => {
            checkQuestionnaireStepCompletion(currentStep);
        });
    });

    continueButtons.forEach(button => {
        button.addEventListener('click', () => showStep(currentStep + 1));
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => showStep(currentStep - 1));
    });

    if (doneButton) {
        doneButton.addEventListener('click', async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) { return modalService.showAlert('Error', 'No user is signed in.'); }

            doneButton.disabled = true;
            doneButton.textContent = "SAVING...";
            try {
                const personalizationData = {
                    personalization: {
                        height: document.getElementById('height').value,
                        weight: document.getElementById('weight').value,
                        gender: document.querySelector('input[name="gender"]:checked')?.value,
                        favoriteColors: Array.from(document.querySelectorAll('input[name="favoriteColor"]:checked')).map(cb => cb.value),
                        favoriteStyles: Array.from(document.querySelectorAll('input[name="favoriteStyle"]:checked')).map(cb => cb.value),
                        stylesToTry: Array.from(document.querySelectorAll('input[name="styleToTry"]:checked')).map(cb => cb.value)
                    }
                };
                await profileService.updateProfile(currentUser.uid, personalizationData);
                window.location.href = "/view/customer-side/pages/c-home.html";
            } catch (error) {
                showModal('Save Failed', error.message, { iconType: 'warning' });
                doneButton.disabled = false;
                doneButton.textContent = "DONE";
            }
        });
    }
});