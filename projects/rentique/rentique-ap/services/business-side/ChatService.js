/*
  @Made By: Anmol Singh
 */

import { firestore } from "./firebase-init.js";
import { profileService } from "./ProfileService.js";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

async function getChatsForUser(userId) {
  if (!userId) throw new Error("User ID is required to fetch chats.");
  const chatsRef = collection(firestore, "chats");
  const q = query(
    chatsRef,
    where("participantIDs", "array-contains", userId),
    orderBy("lastMessageTimestamp", "desc")
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return []; 
  }

  const enrichedChatsPromises = querySnapshot.docs.map(async (chatDoc) => {
    const chatData = chatDoc.data();
    const chatId = chatDoc.id;
    const otherUserId = chatData.participantIDs.find(id => id !== userId);

    if (!otherUserId) {
      return null;
    }
    const userProfileRef = doc(firestore, "profiles", otherUserId);
    const userProfileSnap = await getDoc(userProfileRef);

    if (userProfileSnap.exists()) {
      return {
        id: chatId, 
        ...chatData,
        otherUserProfile: userProfileSnap.data()
      };
    } else {
      return {
        id: chatId,
        ...chatData,
        otherUserProfile: { displayName: "Unknown User", profileImageUrl: null }
      };
    }
  });
  const enrichedChats = await Promise.all(enrichedChatsPromises);
  return enrichedChats.filter(chat => chat !== null);
}

function listenForChatList(userId, callback) {
  if (!userId) throw new Error("User ID is required to listen for chats.");

  const chatsQuery = query(
    collection(firestore, 'chats'), 
    where('participantIDs', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );
  
  return onSnapshot(chatsQuery, callback);
}

function listenForMessages(chatId, callback) {
    if (!chatId) throw new Error("Chat ID is required to listen for messages.");

    const messagesQuery = query(
        collection(firestore, 'chats', chatId, 'messages'), 
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, callback);
}

async function sendMessage(chatId, senderId, text) {
    if (!chatId || !senderId || !text) {
        throw new Error("Chat ID, Sender ID, and message text are required.");
    }
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
        text: text,
        senderID: senderId,
        timestamp: serverTimestamp()
    });

    const chatRef = doc(firestore, 'chats', chatId);
    await updateDoc(chatRef, {
        lastMessageText: text,
        lastMessageTimestamp: serverTimestamp()
    });
}

async function getChatDataById(chatId, currentUserId) {
  if (!chatId || !currentUserId) {
    console.error("[ChatService] Chat ID and User ID are required.");
    return null;
  }

  const chatRef = doc(firestore, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const chatData = chatSnap.data();
    const otherUserId = chatData.participantIDs.find(id => id !== currentUserId);

    if (otherUserId) {
      const otherUser = await profileService.getProfileByUID(otherUserId);
      if (otherUser) {
        return {
          id: chatId,
          ...chatData,
          otherUserProfile: otherUser
        };
      }
    }
  }
  return null;
}

export const ChatService = {
  getChatsForUser,
  listenForChatList,
  listenForMessages,
  sendMessage,
  getChatDataById
};