/*
  @Made By: Anmol Singh
 */
import { firestore } from './firebase-init.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

export async function getChatsForBusiness(businessProfileId) {
  if (!businessProfileId) {
    console.error("getChatsForBusiness Error: businessProfileId is required.");
    return [];
  }

  try {
   
    const chatsRef = collection(firestore, 'chats');
    const q = query(chatsRef, where("participantIDs", "array-contains", businessProfileId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No chats found for business user: ${businessProfileId}`);
      return [];
    }

   
    const chatPromises = querySnapshot.docs.map(async (chatDoc) => {
      const chatData = chatDoc.data();
      
      
      const customerId = chatData.participantIDs.find(id => id !== businessProfileId);

      if (!customerId) {
        return null; 
      }

      
      const customerDocRef = doc(firestore, 'profiles', customerId);
      const customerDocSnap = await getDoc(customerDocRef);

      if (customerDocSnap.exists()) {
        return {
          chatId: chatDoc.id,
          ...chatData,
          customerProfile: customerDocSnap.data() 
        };
      }
      return null;
    });

   
    const chatsWithCustomerInfo = (await Promise.all(chatPromises)).filter(Boolean);

    console.log(`Fetched ${chatsWithCustomerInfo.length} chats with customer details.`);
    return chatsWithCustomerInfo;

  } catch (error) {
    console.error("Error fetching chats for business:", error);
    return [];
  }
}