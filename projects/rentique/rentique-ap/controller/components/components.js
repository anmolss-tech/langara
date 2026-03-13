/*
  @Made By: 
 */
import { auth } from '../../services/business-side/firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import { authService } from '../../services/business-side/AuthService.js';
import { profileService } from '../../services/business-side/ProfileService.js';
import { BusinessProfileService } from '../../services/business-side/BusinessProfileService.js';
import { initializeNetworkStatusListener } from './NetworkStatus.js';


const config = {
    business: {
        logos: {
            main: "/assets/logos/rentique_blue_L.svg",
            sub: "/assets/logos/rentique_blue_S.svg",
            center: "/assets/logos/rentique_blue_S.svg",
            footerMain: "/assets/logos/rentique_blue_L.svg",
            footerSub: "/assets/logos/rentique_green_S.svg",
        },
        icons: {
            search: '/assets/icons/icon_search.svg',
            'right-1': '/assets/icons/Icon_chat.svg',
            'right-2': '/assets/icons/Icon_shop_2.svg',
            'scroll-top': '/assets/icons/Icon_back.svg',
        },
        navLinks: [
            { text: "BROWSE", href: "./b-browse.html" },
            { text: "CHAT LIST", href: "./b-chat.html" },
            { text: "PROFILE", href: "./b-setting.html" },
            { text: "LOG OUT", href: "#", isLogout: true },
        ],
        iconLinks: {
            home: './b-home.html',
            search: './b-browse.html',
            'right-1': './b-chat.html',
            'right-2': './b-setting.html',
        },
        footer: {
            tagline: "Our boutique is for rent.",
            links: [
                { title: "BROWSE", href: "./b-home.html" },
                { title: "CHAT LIST", href: "./b-chat.html" },
                { title: "PROFILE", href: "./b-setting.html" },
            ]
        }
    },
    customer: {
        logos: {
            main: "/assets/logos/rentique_blue_L.svg",
            sub: "/assets/logos/rentique_blue_S.svg",
            center: "/assets/logos/rentique_blue_S.svg",
            footerMain: "/assets/logos/rentique_blue_L.svg",
            footerSub: "/assets/logos/rentique_green_S.svg",
        },
        icons: {
            search: '/assets/icons/icon_search.svg',
            'right-1': '/assets/icons/Icon_chat.svg',
            'right-2': '/assets/icons/Icon_user.svg',
            'scroll-top': '/assets/icons/Icon_back.svg',
        },
        navLinks: [
            { text: "BROWSE", href: "./c-home.html" },
            { text: "CHAT LIST", href: "./c-chat.html" },
            { text: "PROFILE", href: "./c-profile.html" },
            { text: "LOG OUT", href: "#", isLogout: true },
        ],
        iconLinks: {
            home: './c-main-home.html',
            search: './c-home.html',
            'right-1': './c-chat.html',
            'right-2': './c-profile.html',
        },
        footer: {
            tagline: "Our boutique is for rent.",
            links: [
                { title: "BROWSE", href: "./c-home.html" },
                { title: "CHAT LIST", href: "./c-chat.html" },
                { title: "PROFILE", href: "./c-profile.html" },
            ]
        },
    }
};

export async function initializeSharedComponents() {
    initializeNetworkStatusListener();
    const headerPlaceholder = document.getElementById("header-placeholder");
    const footerPlaceholder = document.getElementById("footer-placeholder");
    const loadPromises = [];
    if (headerPlaceholder) {
        loadPromises.push(fetch('/view/components/pages/header.html').then(res => res.text()).then(html => headerPlaceholder.innerHTML = html));
    }
    if (footerPlaceholder) {
        loadPromises.push(fetch('/view/components/pages/footer.html').then(res => res.text()).then(html => footerPlaceholder.innerHTML = html));
    }
    await Promise.all(loadPromises);
    console.log("[Components] Header and Footer HTML have been loaded into the DOM.");

    onAuthStateChanged(auth, async (user) => {
        let displayName = null;
        let userType = 'customer';

        if (user) {
            displayName = localStorage.getItem('userDisplayName');
            const cachedRole = localStorage.getItem('userRole');

            if (!displayName || !cachedRole) {
                console.log("[Components] Profile data not fully cached. Fetching from Firestore...");
                const profile = await profileService.getProfileByUID(user.uid);
                if (profile) {

                    for (let key in profile) {
                        if (key == "roles") {
                            userType = (profile.roles.includes('business')) ? 'business' : 'customer';
                        } else if (key == "role") {
                            userType = ([profile.role].includes('business')) ? 'business' : 'customer';
                        }
                    }

                    if (userType === 'business') {
                        const businessProfile = await BusinessProfileService.getBusinessProfileData(user);
                        displayName = businessProfile.businessName;
                    } else {
                        displayName = profile.displayName;
                    }
                    if (displayName) localStorage.setItem('userDisplayName', displayName);
                    localStorage.setItem('userRole', userType);
                    console.log(`[Components] Fetched and cached user: ${displayName}, Role: ${userType}`);
                }
            } else {
                userType = cachedRole;
                console.log(`[Components] Using cached user: ${displayName}, Role: ${userType}`);
            }
        } else {
            localStorage.clear();
        }
        populateHeader(userType, displayName);
        populateFooter(userType);
    });
}

const getFileName = (path) => path.substring(path.lastIndexOf('/') + 1);

function populateHeader(userType, displayName) {
    const header = document.querySelector("#header-placeholder header");
    if (!header) {
        console.error("Critical Error: Header element not found AFTER loading. Cannot populate.");
        return;
    }

    const userConfig = config[userType] || config.customer;
    const greeting = displayName ? `Hi, ${displayName}` : 'My Account';

    header.querySelectorAll('[data-logo]').forEach(el => {
        const logoKey = el.dataset.logo;
        if (userConfig.logos && userConfig.logos[logoKey]) el.src = userConfig.logos[logoKey];
    });
    header.querySelectorAll('[data-icon]').forEach(el => {
        const iconKey = el.dataset.icon;
        if (userConfig.icons && userConfig.icons[iconKey]) el.src = userConfig.icons[iconKey];
    });

    const navLinksContainer = header.querySelector("[data-nav-links]");
    if (navLinksContainer) {
        const currentPageFile = getFileName(window.location.pathname);
        navLinksContainer.innerHTML = userConfig.navLinks
            .filter(link => !link.isLogout)
            .map(link => {
                const linkFile = getFileName(link.href);
                const activeClass = (currentPageFile === linkFile) ? 'nav-active' : '';  
                return `<li><a href="${link.href}" class="${activeClass}">${link.text}</a></li>`;
            })
            .join('');
    }

    const userMenu = header.querySelector(".user-menu");
    if (userMenu) {
        const trigger = userMenu.querySelector(".user-menu__trigger");
        const greetingEl = userMenu.querySelector("[data-user-greeting]");
        const dropdown = userMenu.querySelector(".user-menu__dropdown");

        if (greetingEl) greetingEl.textContent = greeting;
        const logoutLink = userConfig.navLinks.find(link => link.isLogout);

        if (logoutLink && dropdown) {
            dropdown.innerHTML = `<a href="${logoutLink.href}" data-link-type="logout">Log Out</a>`;
            const logoutAction = dropdown.querySelector('[data-link-type="logout"]');
            if (logoutAction) {
                logoutAction.addEventListener('click', (e) => {
                    e.preventDefault();
                    authService.signOut();
                });
            }
        }

        if (trigger && dropdown) {
            trigger.addEventListener('click', () => {
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                trigger.setAttribute('aria-expanded', !isExpanded);
                dropdown.hidden = isExpanded;
            });
            document.addEventListener('click', (event) => {
                if (!userMenu.contains(event.target)) {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.hidden = true;
                }
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.hidden = true;
                }
            });
        }
    }

    console.log(userConfig.iconLinks)
    if (userConfig.iconLinks) {
        header.querySelectorAll('[data-link]').forEach(linkElement => {
            const linkKey = linkElement.dataset.link;
            if (userConfig.iconLinks[linkKey]) {
                linkElement.href = userConfig.iconLinks[linkKey];
            }
        });
    }
    
    console.log(userConfig.iconLinks.home)
    // Handle the main desktop logo link with data-nav
    header.querySelectorAll('[data-nav="home"]').forEach(linkElement => {
        if (userConfig.iconLinks.home) {
            linkElement.href = userConfig.iconLinks.home;
        }
    });   

    const mobileMenuDropdown = header.querySelector('[data-mobile-user-menu] .user-icon-menu__dropdown');
    if (mobileMenuDropdown && userConfig.navLinks) {
        const logoutLink = userConfig.navLinks.find(link => link.isLogout);
        if (logoutLink) {
            mobileMenuDropdown.innerHTML = `<a href="${logoutLink.href}" data-link-type="logout">Log Out</a>`;
            mobileMenuDropdown.removeAttribute('hidden');
            const logoutAction = mobileMenuDropdown.querySelector('[data-link-type="logout"]');
            if (logoutAction) {
                logoutAction.addEventListener('click', (e) => {
                    e.preventDefault();
                    authService.signOut();
                });
            }
        }
    }
}

function populateFooter(userType) {
    const footer = document.querySelector("#footer-placeholder footer");
    if (!footer) return;

    const userConfig = config[userType] || config.customer;
    if (!userConfig.footer || !userConfig.logos || !userConfig.icons) return;

    footer.querySelectorAll('[data-logo]').forEach(el => {
        const logoKey = el.dataset.logo.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        if (userConfig.logos[logoKey]) el.src = userConfig.logos[logoKey];
    });

    const scrollTopIcon = footer.querySelector('[data-icon="scroll-top"]');
    if (scrollTopIcon && userConfig.icons['scroll-top']) {
        scrollTopIcon.src = userConfig.icons['scroll-top'];
    }

    const taglineEl = footer.querySelector('[data-footer-tagline]');
    if (taglineEl) taglineEl.textContent = userConfig.footer.tagline;

    const footerLinksContainer = footer.querySelector('[data-footer-links]');
    if (footerLinksContainer) {
        footerLinksContainer.innerHTML = userConfig.footer.links
            .map(link => `<h3><a href="${link.href}">${link.title}</a></h3>`)
            .join('');
    }
}

document.addEventListener("DOMContentLoaded", initializeSharedComponents);



function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  } else {
    console.log('[PWA] Service Workers not supported in this browser.');
  }
}

registerServiceWorker();