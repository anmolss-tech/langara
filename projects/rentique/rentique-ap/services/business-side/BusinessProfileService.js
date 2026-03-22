/*
  @Made By: Anmol Singh
 */
import { firestore, auth } from "./firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { StorageService } from "./StorageService.js";
import { authService } from "./AuthService.js";

async function _getBusinessIdsForUser(user) {
  if (!user || !user.uid) {
    throw new Error("Valid user object with UID is required.");
  }

  const businessesRef = collection(firestore, "businesses");
  const q = query(businessesRef, where("profileID", "==", user.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("No business profile found for the current user.");
  }

  const businessDoc = querySnapshot.docs[0];

  return {
    profileId: user.uid,
    businessId: businessDoc.id,
  };
}

async function getBusinessProfileData(user) {
  console.log("[BusinessProfileService] Fetching business profile data...");
  const { profileId, businessId } = await _getBusinessIdsForUser(user);

  const profileRef = doc(firestore, "profiles", profileId);
  const businessRef = doc(firestore, "businesses", businessId);

  const [profileSnap, businessSnap] = await Promise.all([getDoc(profileRef), getDoc(businessRef)]);

  if (!profileSnap.exists()) {
    throw new Error(`Profile data could not be found for user ID: ${profileId}`);
  }
  if (!businessSnap.exists()) {
    throw new Error(`Business data could not be found for business ID: ${businessId}`);
  }

  const profileData = profileSnap.data();
  const businessData = businessSnap.data();

  return {
    id: businessId,
    profileId: profileId,
    businessName: businessData.businessName,
    address: businessData.location?.address || "", 
    brandImageUrl: businessData.brandImageUrl || null,
    email: profileData.email,
  };
}

async function updateBusinessProfile(updateData, imageFile = null, currentPassword = null) {
  console.log("[BusinessProfileService] Starting comprehensive business profile update...");
  const user = auth.currentUser;
  const { profileId, businessId } = await _getBusinessIdsForUser(user);

  if (updateData.email && updateData.email.toLowerCase() !== user.email.toLowerCase()) {
    if (!currentPassword) {
      throw { code: 'auth/password-required', message: 'Password is required to change your email.' };
    }
    const result = await authService.updateAuthEmail(updateData.email, currentPassword);
  }
  


  
  
 
  
  
  const businessRef = doc(firestore, "businesses", businessId);
  const businessSnap = await getDoc(businessRef);
  const oldBusinessName = businessSnap.data().businessName; 
  const isNameChanging = updateData.businessName && updateData.businessName !== oldBusinessName;
  const batch = writeBatch(firestore);
  const businessUpdates = {};
  if (updateData.businessName) businessUpdates.businessName = updateData.businessName;
  
  if (updateData.location) {
    businessUpdates.location = updateData.location; 
  }
  if (imageFile) {
    const newImageUrl = await StorageService.uploadFile(imageFile, `brand_logos/${businessId}`);
    if (newImageUrl) businessUpdates.brandImageUrl = newImageUrl;
  }

  if (Object.keys(businessUpdates).length > 0) {
    batch.update(businessRef, businessUpdates);
  }
  
  const profileRef = doc(firestore, "profiles", profileId);
  if (updateData.email) {
      batch.update(profileRef, { email: updateData.email });
  }
  
  if (isNameChanging) {
    console.log(`[BusinessProfileService] Business name changed from "${oldBusinessName}" to "${updateData.businessName}". Propagating changes to products...`);
    const productsRef = collection(firestore, "products");
    const q = query(productsRef, where("businessID", "==", businessId));
    const productsSnapshot = await getDocs(q);

    if (productsSnapshot.docs.length >= 500) {
        console.warn("User has >= 500 products. Client-side batch write may fail. A Cloud Function is recommended.");
    }

    productsSnapshot.forEach(productDoc => {
      const productRef = doc(firestore, "products", productDoc.id);
      batch.update(productRef, { businessName: updateData.businessName });
    });
    console.log(`[BusinessProfileService] Added ${productsSnapshot.size} products to the update batch.`);
  }
  
  await batch.commit();
  console.log("[BusinessProfileService] Batch commit successful. Profile and all associated products updated.");
}

export const BusinessProfileService = {
  getBusinessProfileData,
  updateBusinessProfile,
};