import { firestore as db } from "../business-side/firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getBusinessByProfileId } from "./BusinessService.js";
import { profileService } from "./ProfileService.js";

export async function findOrCreateChat(customerId, businessId, productContext) {
  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("participantIDs", "array-contains", customerId)
  );
  const querySnapshot = await getDocs(q);
  let existingChat = null;
  querySnapshot.forEach((doc) => {
    if (doc.data().participantIDs.includes(businessId)) {
      existingChat = { id: doc.id, ...doc.data() };
    }
  });

  if (existingChat) {
    return existingChat.id;
  } else {
    const newChatDoc = await addDoc(chatsRef, {
      participantIDs: [customerId, businessId],
      productContext,
      lastMessageText: `Inquiring about: ${productContext.itemName}`,
      lastMessageTimestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return newChatDoc.id;
  }
}

export function listenForChatList(userId, callback) {
  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("participantIDs", "array-contains", userId),
    orderBy("lastMessageTimestamp", "desc")
  );
  return onSnapshot(q, callback);
}

export async function getChatDataById(chatId, currentUserId) {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) return null;

  const chatData = chatSnap.data();
  const otherId = chatData.participantIDs.find((id) => id !== currentUserId);
  if (!otherId) return null;

  let chatPartnerName = "Unknown User";
  let chatPartnerAvatar = "https://via.placeholder.com/48";

  const businessProfile = await getBusinessByProfileId(otherId);
  if (businessProfile) {
    chatPartnerName = businessProfile.businessName;
    chatPartnerAvatar = businessProfile.brandImageUrl;
  } else {
    const userProfile = await profileService.getProfileByUID(otherId);
    if (userProfile) {
      chatPartnerName = userProfile.displayName;
    }
  }

  return {
    ...chatData,
    id: chatId,
    chatPartner: {
      name: chatPartnerName,
      avatar: chatPartnerAvatar,
    },
  };
}

export function listenForMessages(chatId, callback) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, callback);
}

export async function sendMessage(chatId, senderId, text) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderID: senderId,
    text: text,
    timestamp: serverTimestamp(),
  });
  const chatRef = doc(db, "chats", chatId);
  await setDoc(
    chatRef,
    {
      lastMessageText: text,
      lastMessageTimestamp: serverTimestamp(),
    },
    { merge: true }
  );
}

export const ChatService = {
  listenForChatList,
  getChatDataById,
  findOrCreateChat,
  listenForMessages,
  sendMessage,
};
