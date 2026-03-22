/*
  @Made By: Anmol Singh
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js"; 

const firebaseApp = initializeApp(firebaseConfig);

export const firestore = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

enableIndexedDbPersistence(firestore)
  .then(() => {
    console.log("[PWA] Firestore offline persistence enabled successfully.");
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("[PWA] Firestore offline persistence failed (likely due to multiple tabs).");
    } else if (err.code == 'unimplemented') {
      console.warn("[PWA] Firestore offline persistence is not supported in this browser.");
    } else {
      console.error("[PWA] Firestore offline persistence failed with error:", err);
    }
  });

console.log("Firebase has been initialized successfully!");