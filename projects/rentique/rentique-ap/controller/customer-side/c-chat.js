/*
  @Revised By: Carlose
 */
import { auth } from "../../../services/business-side/firebase-init.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"
import { ChatService } from "../../../services/customer-side/ChatService.js"
import { profileService } from "../../../services/business-side/ProfileService.js"
import { authService } from "../../../services/business-side/AuthService.js"
import { getBusinessByProfileId } from "../../../services/customer-side/BusinessService.js"

let currentUserId = null
let activeChatId = null
let unsubscribeChatList = null
let unsubscribeMessages = null

const chatContainer = document.querySelector(".chat-container")
const chatListEl = document.getElementById("chatList")
const messagesContainerEl = document.getElementById("messagesContainer")
const messagesAreaEl = document.getElementById("messagesArea")
const chatTitleEl = document.getElementById("chatTitle")
const messageInputEl = document.getElementById("messageInput")
const sendButtonEl = document.getElementById("sendButton")
const backToChatListBtn = document.getElementById("backToChatListBtn")
const userGreetingEl = document.getElementById("userGreeting")
const userMenuTrigger = document.querySelector(".user-menu__trigger")
const userMenuDropdown = document.querySelector(".user-menu__dropdown")
const logoutLink = document.querySelector('[data-link-type="logout"]')
const mobileProfilePic = document.getElementById("mobileProfilePic")

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid
    initializeApp(user)
  } else {
    window.location.href = "./auth-login-customer.html"
  }
})

async function initializeApp(user) {
  sendButtonEl.addEventListener("click", handleSendMessage)
  messageInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  })
  backToChatListBtn.addEventListener("click", () => {
    chatContainer.classList.remove("chat-view-active")
    if (unsubscribeMessages) unsubscribeMessages()
    activeChatId = null
  })

  await setupUserMenu(user)

  listenForChats()
  const headerElement = document.querySelector("#header-placeholder header")
  if (headerElement) {
    headerElement.style.padding = "1.3rem 0 0 0"
    console.log("[c-chat.js] Header padding adjusted for compact view.")
  }
  const urlParams = new URLSearchParams(window.location.search)
  const preselectedChatId = urlParams.get("id")

  if (preselectedChatId) {
    console.log(`[c-chat.js] Pre-selecting chat from URL: ${preselectedChatId}`)

    try {
      const enrichedChat = await ChatService.getChatDataById(preselectedChatId, currentUserId)

      if (enrichedChat) {
        chatContainer.classList.add("chat-view-active")
        selectChat(enrichedChat.id, enrichedChat.chatPartner.name)
      } else {
        console.error(`[c-chat.js] Chat with ID ${preselectedChatId} from URL not found or invalid.`)
      }
    } catch (error) {
      console.error("Error pre-selecting chat:", error)
    }
  }
}

async function setupUserMenu(user) {
  let displayName = localStorage.getItem("userDisplayName")
  let profileImageUrl = localStorage.getItem("userProfileImage")
 
  if (!displayName || !profileImageUrl) {
    console.log("[c-chat.js] User data not cached. Fetching from Firestore...")
    const profile = await profileService.getProfileByUID(user.uid)
    if (profile) {
      displayName = profile.displayName
    //   profileImageUrl = profile.profileImageUrl || "/assets/icons/user.svg"
      profileImageUrl = "/assets/icons/Icon_user.svg"

      if (displayName) localStorage.setItem("userDisplayName", displayName)
      if (profileImageUrl) localStorage.setItem("userProfileImage", profileImageUrl)
    }
  }

  if (userGreetingEl && displayName) {
    userGreetingEl.textContent = `Hi, ${displayName}`
  }

  if (mobileProfilePic && profileImageUrl) {
    mobileProfilePic.src = profileImageUrl
  }

  if (userMenuTrigger && userMenuDropdown) {
    userMenuTrigger.addEventListener("click", () => {
      const isExpanded = userMenuTrigger.getAttribute("aria-expanded") === "true"
      userMenuTrigger.setAttribute("aria-expanded", !isExpanded)
      userMenuDropdown.hidden = isExpanded
    })

    document.addEventListener("click", (event) => {
      const userMenu = document.querySelector(".user-menu")
      if (userMenu && !userMenu.contains(event.target)) {
        userMenuTrigger.setAttribute("aria-expanded", "false")
        userMenuDropdown.hidden = true
      }
    })

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        userMenuTrigger.setAttribute("aria-expanded", "false")
        userMenuDropdown.hidden = true
      }
    })
  }

  const logoutLinks = document.querySelectorAll('[data-link-type="logout"]')
  logoutLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      authService.signOut()
    })
  })
}

function listenForChats() {
  if (unsubscribeChatList) unsubscribeChatList()

  unsubscribeChatList = ChatService.listenForChatList(currentUserId, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added" || change.type === "modified") {
        renderChatItem(change.doc)
      }
      if (change.type === "removed") {
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${change.doc.id}"]`)
        if (chatItem) chatItem.remove()
      }
    })
  })
}

async function renderChatItem(chatDoc) {
  const chatData = chatDoc.data()
  const otherParticipantId = chatData.participantIDs.find((id) => id !== currentUserId)

  if (!otherParticipantId) return
  const businessProfile = await getBusinessByProfileId(otherParticipantId)

  let chatName = "Unknown Business"
  let avatarUrl = "https://via.placeholder.com/48"

  if (businessProfile) {
    chatName = businessProfile.businessName
    avatarUrl = businessProfile.brandImageUrl || avatarUrl
  } else {
    const ownerProfile = await profileService.getProfileByUID(otherParticipantId)
    if (ownerProfile) {
      chatName = ownerProfile.displayName || "Unnamed User"
    }
  }

  let chatItem = document.querySelector(`.chat-item[data-chat-id="${chatDoc.id}"]`)
  if (!chatItem) {
    chatItem = document.createElement("div")
    chatItem.className = "chat-item"
    chatItem.dataset.chatId = chatDoc.id
  }

  let timeString = ""
  if (chatData.lastMessageTimestamp) {
    timeString = new Date(chatData.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  chatItem.innerHTML = `
      <div class="chat-avatar" style="background-image: url(${avatarUrl})"></div>
      <div class="chat-info">
        <div class="chat-info-header">
          <span class="chat-name">${chatName}</span>
          <span class="chat-time">${timeString}</span>
        </div>
        <p class="chat-preview">${chatData.lastMessageText || "No messages yet"}</p>
      </div>
      <svg class="chat-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    `
  chatItem.addEventListener("click", () => {
    chatContainer.classList.add("chat-view-active")
    selectChat(chatDoc.id, chatName)
  })

  chatListEl.prepend(chatItem)
}

function selectChat(chatId, otherUserName) {
  if (activeChatId === chatId) return

  activeChatId = chatId
  chatTitleEl.textContent = otherUserName ? otherUserName.toUpperCase() : "CHAT"
  messagesContainerEl.innerHTML = ""

  let lastRenderedDate = null

  if (unsubscribeMessages) unsubscribeMessages()
  unsubscribeMessages = ChatService.listenForMessages(chatId, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const messageData = change.doc.data()
        const messageDate = messageData.timestamp ? new Date(messageData.timestamp.seconds * 1000) : new Date()
        const messageDateString = messageDate.toLocaleDateString()

        if (messageDateString !== lastRenderedDate) {
          renderDateSeparator(messageDate)
          lastRenderedDate = messageDateString
        }

        renderMessage(change.doc)
      }
    })
    scrollToBottom()
  })
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.chatId === chatId)
  })
}

function renderDateSeparator(date) {
  const separator = document.createElement("div")
  separator.className = "date-separator"

  const today = new Date()
  const isToday = date.toLocaleDateString() === today.toLocaleDateString()

  const timeString = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  separator.textContent = isToday ? `Today ${timeString}` : `${date.toLocaleDateString()} ${timeString}`

  messagesContainerEl.appendChild(separator)
}

function renderMessage(messageDoc) {
  const msg = messageDoc.data()
  const isSent = msg.senderID === currentUserId

  const row = document.createElement("div")
  row.className = `message-row ${isSent ? "right" : "left"}`

  if (msg.itemCard) {
    const itemCard = document.createElement("div")
    itemCard.className = "item-card"
    itemCard.innerHTML = `
            <img src="${msg.itemCard.imageUrl || "https://via.placeholder.com/300x240"}" alt="Item" class="item-card-image">
            <div class="item-card-details">
                <div>
                    <div class="item-card-label">Item Name</div>
                    <div class="item-card-value">${msg.itemCard.itemName || "N/A"}</div>
                </div>
                <div>
                    <div class="item-card-label">Description</div>
                    <div class="item-card-value">${msg.itemCard.description || "N/A"}</div>
                </div>
                <div>
                    <div class="item-card-label">Brand Name</div>
                    <div class="item-card-value">${msg.itemCard.brandName || "N/A"}</div>
                </div>
            </div>
        `
    row.appendChild(itemCard)
  } else {
    const bubble = document.createElement("div")
    bubble.className = `message-bubble ${isSent ? "sent" : "received"}`
    bubble.textContent = msg.text
    row.appendChild(bubble)
  }

  messagesContainerEl.appendChild(row)
}

async function handleSendMessage() {
  const text = messageInputEl.value.trim()
  if (text === "" || !activeChatId) return

  const messageText = text
  messageInputEl.value = ""

  try {
    await ChatService.sendMessage(activeChatId, currentUserId, messageText)
  } catch (error) {
    console.error("Error sending message:", error)
    messageInputEl.value = messageText
  }
}

function scrollToBottom() {
  messagesAreaEl.scrollTop = messagesAreaEl.scrollHeight
}
