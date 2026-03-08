/*
  @Made By: 
 */
import { auth } from "../../../services/business-side/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

import { initializeProductList } from "./productList.js";
import { BusinessProfileService } from "../../services/business-side/BusinessProfileService.js";

import { ChatService } from "../../../services/business-side/ChatService.js";

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initializeApp(user);
    } else {
      window.location.href = "./auth-login-business.html";
    }
  });
});

async function initializeApp(user) {
  console.log(`[b-home.js] Initializing page for business user: ${user.uid}`);
  
  try {
    
   
    const [businessProfile] = await Promise.all([
        BusinessProfileService.getBusinessProfileData(user),
       
    ]);

    const displayNameForHeader = businessProfile.businessName;
    
   
   
   
    localStorage.setItem('userDisplayName', displayNameForHeader);
    localStorage.setItem('userRole', 'business');
    

   
    const itemsGrid = document.getElementById("itemsGrid");
    if (itemsGrid) {
      initializeProductList(itemsGrid, { businessId: businessProfile.id });
    }
    
    
    fetchAndRenderChats(user);

    setupPageSpecificEventListeners();
    initializeCarousel();
    initializeFabPositioning();
  } catch (error) {
    console.error("[b-home.js] Critical error during page initialization:", error);
    document.body.innerHTML = "<h1>Error</h1><p>Could not load your business dashboard. Please try again later.</p>";
  }
}

async function fetchAndRenderChats(user) {
    const chatListContainer = document.getElementById("chatList");
    if (!chatListContainer) return;

    chatListContainer.innerHTML = "<p>Loading chats...</p>";

    try {
        const chats = await ChatService.getChatsForUser(user.uid);
        renderChats(chats);
    } catch (error) {
        console.error("Failed to fetch and render chats:", error);
        chatListContainer.innerHTML = "<p class='error'>Could not load chats.</p>";
    }
}

function renderChats(chats) {
    const chatListContainer = document.getElementById("chatList");
    // MODIFICATION START
    const prevBtn = document.querySelector('.carousel-btn.prev-btn');
    const nextBtn = document.querySelector('.carousel-btn.next-btn');
    // MODIFICATION END

    if (!chats || chats.length === 0) {
        chatListContainer.innerHTML = "<p>No active chats.</p>";
        // Hide buttons if there are no chats
        if(prevBtn && nextBtn) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
        return;
    }

    // MODIFICATION START
    // Conditionally show buttons based on the number of chats
    if(prevBtn && nextBtn) {
        if (chats.length >= 4) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }
    // MODIFICATION END

    chatListContainer.innerHTML = chats.map(chat => {
        const profile = chat.otherUserProfile;
        const defaultAvatar = 'https://via.placeholder.com/100/06324f/FFFFFF?text=U'; 
      return `
        <a href="./b-chat.html?id=${chat.id}" class="chat-item" title="Chat with ${profile.displayName || 'User'}">
          <img src="${profile.profileImageUrl || defaultAvatar}" alt="${profile.displayName || 'User'}" class="chat-avatar">
        </a>
      `;
    }).join('');
}


function setupPageSpecificEventListeners() {
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            window.location.href = './b-add-item.html';
        });
    }
}

function initializeCarousel() {
  const chatList = document.getElementById('chatList');
  const prevBtn = document.querySelector('.carousel-btn.prev-btn');
  const nextBtn = document.querySelector('.carousel-btn.next-btn');
  if (chatList && prevBtn && nextBtn) {
    const scrollAmount = 300;
    nextBtn.addEventListener('click', () => chatList.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
    prevBtn.addEventListener('click', () => chatList.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
  }
}

function initializeFabPositioning() {
  const fab = document.getElementById("addBtn")
  const footer = document.getElementById("footer-placeholder")
  if (!fab || !footer) {
    console.warn("[b-home.js] FAB or Footer element not found. Cannot initialize positioning logic.")
    return
  }
  let hasScrolled = false

  const adjustFabPosition = () => {
    const footerRect = footer.getBoundingClientRect()
    const fabHeight = fab.offsetHeight
    const fabBottomMargin = 96 // 6rem in pixels
    const windowHeight = window.innerHeight
    const footerTop = footerRect.top
    const fabBottom = windowHeight - fabBottomMargin
    
        if (footerRect.top < windowHeight) {
            
            fab.style.position = 'absolute';
            const scrollY = window.scrollY || window.pageYOffset;
            
            fab.style.top = `${scrollY + footerRect.top - fab.offsetHeight - 20}px`; 
            fab.style.bottom = 'auto';
        } else {
           
            fab.style.position = 'fixed';
            fab.style.top = 'auto';
            fab.style.bottom = window.innerWidth > 1024 ? "2rem" : "6rem";
        }
  }
  
  window.addEventListener("scroll", adjustFabPosition)
  window.addEventListener("resize", adjustFabPosition)
    setTimeout(() => {
        adjustFabPosition();
        fab.classList.add('visible');
    }, 700);
}
