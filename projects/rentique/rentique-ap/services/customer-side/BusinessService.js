import { firestore as db } from "../business-side/firebase-init.js";
import { collection, query, where, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


export async function getBusinessById(businessId) {
    if (!businessId) {
        console.error("getBusinessById called with no ID.");
        return null;
    }
    try {
        console.log("businessRef1");
        const businessRef = doc(db, "businesses", businessId);
        console.log("businessRef");
        console.log(businessRef);
        const docSnap = await getDoc(businessRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn(`No business found with ID: ${businessId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching business by ID:", error);
        return null;
    }
}


export async function getAllBusinesses() {
    try {
        const businessesRef = collection(db, "businesses");
        const snapshot = await getDocs(businessesRef);
        if (snapshot.empty) {
            console.warn("No businesses found in the collection.");
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return [];
    }
}

export async function getBusinessByProfileId(profileId) {
    if (!profileId) return null;

    try {
        const businessesRef = collection(db, "businesses");
        const q = query(businessesRef, where("profileID", "==", profileId));
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const businessDoc = querySnapshot.docs[0];
            return { id: businessDoc.id, ...businessDoc.data() };
        } else {
            console.warn(`No business found for profileID: ${profileId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching business by profile ID:", error);
        return null;
    }
}
