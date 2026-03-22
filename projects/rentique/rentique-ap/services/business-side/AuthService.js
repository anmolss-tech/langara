/*
  @Made By: Anmol Singh
 */
import { auth, firestore } from "./firebase-init.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail,   
  signOut
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

class AuthService {
    async signUp(email, password, initialRole) {
        console.log(`[AuthService] - Attempting to sign up ${email} with role ${initialRole}`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profileRef = doc(firestore, 'profiles', user.uid);
        
        if (initialRole === "customer") {
            await setDoc(profileRef, {
                email: user.email,
                roles: [initialRole],
                createdAt: new Date(),
                displayName: '',
            });
        } else {
            await setDoc(profileRef, {
                email: user.email,
                roles: [initialRole],
                createdAt: new Date(),
            });
        }

        console.log(`[AuthService] - User ${user.uid} created successfully.`);
        return userCredential;
    }

    async signIn(email, password) {
        console.log(`[AuthService] - Attempting to sign in ${email}`);
        return await signInWithEmailAndPassword(auth, email, password);
    }

    async addRoleToExistingUser(uid, newRole) {
        console.log(`[AuthService] - Adding role '${newRole}' to user ${uid}`);
        const profileRef = doc(firestore, 'profiles', uid);
        await updateDoc(profileRef, {
            roles: arrayUnion(newRole)
        });
        console.log(`[AuthService] - Role added successfully.`);
    }
     async sendPasswordReset(email) {
        console.log(`[AuthService] - Sending password reset to: ${email}`);
        return await sendPasswordResetEmail(auth, email);
    }
    async changePassword(currentPassword, newPassword) {
        console.log("[AuthService] - Attempting to change password...");
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user is currently signed in.");
        }
        
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        console.log("[AuthService] - Password updated successfully.");
    }
    async updateAuthEmail(newEmail, currentPassword) {
        console.log(`YOYO ${newEmail}...`);
        console.log(`[AuthService] - Starting secure email update check for ${newEmail}...`);
        const user = auth.currentUser;
        if (!user) throw new Error("No user is currently signed in.");
        const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
        console.log("80: signInMethods")
        console.log(signInMethods)
        if (signInMethods.length > 0) {
            console.error(`[AuthService] - The email ${newEmail} is already in use.`);
            throw { code: 'auth/email-already-in-use', message: 'This email address is already in use by another account.' };
        }
        
        console.log("[AuthService] - New email is available. Re-authenticating user...");
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        console.log("[AuthService] - Re-authentication successful. Sending verification email...");
        await verifyBeforeUpdateEmail(user, newEmail);
        
        console.log(`[AuthService] - Verification email sent. User must click the link to finalize the change.`);
    }
    async signOut() {
        console.log("[AuthService] - Signing out user.");
        await signOut(auth);
        localStorage.clear(); 
        console.log("[AuthService] - Local storage cleared. Redirecting to login.");
        window.location.href = '/auth-home.html'; 
    }
}

export const authService = new AuthService();