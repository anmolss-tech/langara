/*
  @Made By: Anmol Singh
 */
import { firestore } from './firebase-init.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    collection, 
    serverTimestamp,
    query,      
    where,      
    getDocs      
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

class ProfileService {
    async getProfile(userId) {
        try {
            console.log(`[ProfileService] - Fetching profile for UID: ${userId}`);
            const profileRef = doc(firestore, 'profiles', userId);
            const docSnap = await getDoc(profileRef);
            
            if (docSnap.exists()) {
                console.log(`[ProfileService] - Profile found for UID: ${userId}`);
                return docSnap.data();
            } else {
                console.warn(`[ProfileService] - No profile document found for UID: ${userId}`);
                return null;
            }
        } catch (error) {
            console.error(`[ProfileService] - Error fetching profile for UID: ${userId}`, error);
            throw error; 
        }
    }

    async getProfileByEmail(email) {
        try {
            console.log(`[ProfileService] - Fetching profile for email: ${email}`);
            const profilesRef = collection(firestore, 'profiles');
            const q = query(profilesRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.warn(`[ProfileService] - No profile found for email: ${email}`);
                return null;
            }
            const profileData = querySnapshot.docs[0].data();
            console.log(`[ProfileService] - Profile found for email: ${email}`);
            return profileData;
        } catch (error) {
            console.error(`[ProfileService] - Error fetching profile by email: ${email}`, error);
            throw error;
        }
    }

    async updateProfile(userId, data) {
        try {
            console.log(`[ProfileService] - Updating profile for UID: ${userId} with data:`, data);
            const profileRef = doc(firestore, 'profiles', userId);
            await setDoc(profileRef, data, { merge: true });
            console.log(`[ProfileService] - Profile updated successfully for UID: ${userId}`);
        } catch (error) {
            console.error(`[ProfileService] - Error updating profile for UID: ${userId}`, error);
            throw error;
        }
    }
    

    async createBusiness(ownerId, businessData) {
        try {
            console.log(`[ProfileService] - Creating business for owner UID: ${ownerId}`);
            const businessesRef = collection(firestore, 'businesses');
            
            const locationText = businessData.location || null;
            
            const newBusinessDoc = await addDoc(businessesRef, {
                profileID: ownerId,
                businessName: businessData.businessName,
                brandImageUrl: businessData.brandImageUrl || null,
                location: locationText,
                createdAt: serverTimestamp()
            });
            console.log(`[ProfileService] - Business created successfully with ID: ${newBusinessDoc.id}`);
            return newBusinessDoc;
        } catch (error) {
            console.error(`[ProfileService] - Error creating business for owner UID: ${ownerId}`, error);
            throw error;
        }
    }
    
    async getProfileByUID(uid) {
    if (!uid) return null;
    const profileRef = doc(firestore, "profiles", uid);
    const profileSnap = await getDoc(profileRef);

    return profileSnap.exists() ? profileSnap.data() : null;
    }
}

export const profileService = new ProfileService();