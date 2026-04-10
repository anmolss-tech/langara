import { auth, firestore as db } from "../business-side/firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

export async function likeProduct(product) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("User not logged in — skipping like.");
    return;
  }
  try {
    const profileRef = doc(db, "profiles", user.uid);
    await setDoc(
      profileRef,
      {
        likedProductIDs: arrayUnion(product.id),
      },
      { merge: true }
    );

    console.log(`Liked product ${product.id} saved for user ${user.uid}`);
  } catch (err) {
    console.error("Error saving like:", err);
  }
}

export async function passProduct(product) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("⚠️ User not logged in — skipping pass.");
    return;
  }

  try {
    const passRef = doc(db, `profiles/${user.uid}/passedItems`, product.id);
    await setDoc(passRef, { productId: product.id, passedAt: new Date() });

    console.log(`UserService: Passed product recorded for user ${user.uid}`);
  } catch (err) {
    console.error("UserService: Error saving pass:", err);
  }
}

export async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const profileRef = doc(db, "profiles", user.uid);
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn("User profile document does not exist.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
