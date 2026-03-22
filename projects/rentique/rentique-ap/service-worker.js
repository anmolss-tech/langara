//@Made By: Anmol Singh

const CACHE_NAME = 'rentique-cache-v1';
const FALLBACK_IMAGE_URL = '/assets/img/no-image.png';

const APP_SHELL_URLS = [
  '/',

  // --- Core HTML Views: Business Side ---
  '/auth-home.html',
  '/view/business-side/pages/auth-login-business.html',
  '/view/business-side/pages/auth-signup-business.html',
  '/view/business-side/pages/auth-signup-customer.html',
  '/view/business-side/pages/b-home.html',
  '/view/business-side/pages/b-browse.html',
  '/view/business-side/pages/b-chat.html',
  '/view/business-side/pages/b-add-item.html',
  '/view/business-side/pages/b-edit-item.html',
  '/view/business-side/pages/b-detail-item.html',
  '/view/business-side/pages/b-profile.html',
  '/view/business-side/pages/b-change-password.html',
  '/view/business-side/pages/b-setting.html',
  
  // --- Core HTML Views: Customer Side ---
  '/view/customer-side/pages/auth-login-customer.html',
  '/view/customer-side/pages/c-main-home.html',
  '/view/customer-side/pages/c-chat.html',
  '/view/customer-side/pages/c-detail-item.html',
  '/view/customer-side/pages/c-home.html',
  '/view/customer-side/pages/c-profile.html',

  // --- Shared Component HTML ---
  '/view/components/pages/header.html',
  '/view/components/pages/footer.html',
  '/view/components/pages/filter-modal.html',
  '/view/components/pages/sort-modal.html',

  // --- Shared Component CSS ---
  '/view/components/css/var.css',
  '/view/components/css/header-footer.css',
  '/view/components/css/modal.css',
  '/view/components/css/sort-modal.css',
  '/view/components/css/filter-modal.css',

  // --- Page-Specific CSS: Business Side ---
  // '/view/business-side/css/auth.css',
  '/view/business-side/css/auth-common.css',
  '/view/business-side/css/auth-login.css',
  '/view/business-side/css/auth-password.css',
  '/view/business-side/css/auth-signup-business.css',
  '/view/business-side/css/auth-signup-customer.css',
  '/view/business-side/css/auth-signup.css',
  '/view/business-side/css/auth-password.css',
  '/view/business-side/css/b-add-item.css',
  '/view/business-side/css/b-change-password.css',
  '/view/business-side/css/b-chat-header.css',
  '/view/business-side/css/b-chat.css',
  '/view/business-side/css/b-detail-item.css',
  '/view/business-side/css/b-home.css',
  '/view/business-side/css/b-profile.css',
  '/view/business-side/css/b-setting.css',
  
  // --- Page-Specific CSS: Customer Side ---
  '/view/customer-side/css/c-welcome.css',
  '/view/customer-side/css/auth-common.css',
  '/view/customer-side/css/auth-login.css',
  '/view/customer-side/css/c-chat.css',
  '/view/customer-side/css/c-detail-item.css',
  '/view/customer-side/css/c-home.css',
  '/view/customer-side/css/c-profile.css',
  '/view/customer-side/css/main.css',
  

  // --- Core JavaScript Controllers: Business Side ---
  '/controller/components/components.js',
  '/controller/components/modal.js',
  '/controller/components/filter-modal.js',
  '/controller/components/sort-modal.js',
  '/controller/shared/ProductListController.js',
  '/controller/business-side/auth-login.js',
  '/controller/business-side/auth-signup-business.js',
  '/controller/business-side/b-home.js',
  '/controller/business-side/b-chat.js',
  '/controller/business-side/b-profile.js',
  '/controller/business-side/b-change-password.js',
  '/controller/business-side/b-add-item.js',
  '/controller/business-side/b-edit-item.js',
  '/controller/business-side/b-detail-item.js',
  
  // --- Core JavaScript Controllers: Customer Side ---
  '/controller/customer-side/auth-login.js',
  '/controller/customer-side/c-chat.js',
  '/controller/customer-side/c-detail-item.js',
  '/controller/customer-side/c-home.js',
  '/controller/customer-side/c-likedStyles.js',
  '/controller/customer-side/c-profile.js',
  
  
  // --- Shared Component Controllers ---
  '/controller/components/components.js',
  '/controller/components/filter-modal.js',
  '/controller/components/modal.js',
  '/controller/components/sort-modal.js',
  '/controller/components/swipeComponent.js',
  '/controller/components/NetworkStatus.js',

  // --- Core JavaScript Services: Business Side ---
  '/services/business-side/firebase-init.js',
  '/services/business-side/AuthService.js',
  '/services/business-side/BusinessProfileService.js',
  '/services/business-side/ChatService.js',
  '/services/business-side/Geocoding.js',
  '/services/business-side/HomePageService.js',
  '/services/business-side/ProductService.js',
  '/services/business-side/ProfileService.js',
  '/services/business-side/StorageService.js',
  
  // --- Core JavaScript Services: Customer Side ---
  '/services/customer-side/BusinessService.js',
  '/services/customer-side/ChatService.js',
  '/services/customer-side/ProductProcessor.js',
  '/services/customer-side/ProductService.js',
  '/services/customer-side/ProfileService.js',
  '/services/customer-side/UserService.js',

  // --- PWA Manifest and Icons ---
  '/manifest.json',

  // --- Key Brand Assets ---
 '/assets/logos/rentique_blue_L.svg',
 '/assets/logos/rentique_blue_M.svg',
 '/assets/logos/rentique_blue_S.svg',
 '/assets/logos/rentique_green_L.svg',
 '/assets/logos/rentique_green_M.svg',
 '/assets/logos/rentique_green_S.svg',
 '/assets/logos/rentique-main.png',
 '/assets/logos/rentique-sub.png',

 '/assets/img/no-image.png',
 '/placeholder.svg',
 
 '/assets/icons/chatBack.svg',
 '/assets/icons/chatForward.svg',
 '/assets/icons/icon_back.svg',
 '/assets/icons/icon_cart.svg',  
 '/assets/icons/icon_chat.svg',
 '/assets/icons/icon_close.svg',
 '/assets/icons/icon_dislike.svg',
 '/assets/icons/icon_dropdown.svg',
 '/assets/icons/icon_eye_closed.svg',
 '/assets/icons/icon_eye.svg',
 '/assets/icons/icon_filter.svg',
 '/assets/icons/icon_like.svg',
 '/assets/icons/icon_pencil.svg',
 '/assets/icons/icon_plus.svg',
 '/assets/icons/icon_search.svg',
 '/assets/icons/icon_send.svg',
 '/assets/icons/icon_shop_2.svg',
 '/assets/icons/icon_shop.svg',
 '/assets/icons/icon_sort.svg',
 '/assets/icons/icon_sustainable.svg',
 '/assets/icons/icon_trashcan.svg', 
 '/assets/icons/icon_user.svg'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event fired.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell...');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(error => {
        console.error('[Service Worker] App shell caching failed. Check paths.', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }
  
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).catch((error) => {
        console.warn(`[Service Worker] Network fetch failed for: ${request.url}.`, error);
        
        if (request.destination === 'image') {
          console.log('[Service Worker] Returning fallback image.');
          return caches.match(FALLBACK_IMAGE_URL);
        }
        
        return new Response('Network error', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    })
  );
});