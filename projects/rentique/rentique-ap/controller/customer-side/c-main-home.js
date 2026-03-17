/* -------------------------------
   Revised by Bella, Rika
--------------------------------*/

import { getAllProducts } from "../../services/customer-side/ProductService.js";
import {
    getCurrentUserProfile,
    likeProduct,
    passProduct,
} from "../../services/customer-side/UserService.js";
import { getAllBusinesses } from "../../services/customer-side/BusinessService.js";
import { initializeSwipe } from "../components/swipeComponent.js";

let allProducts = [];
let swipeProducts = [];
let customerProfile = null;

/* -------------------------------
   RENDER SWIPE THUMBNAILS
--------------------------------*/
function renderSwipeItems(products) {
    const container = document.querySelector(".swipe-items");
    if (!container) return;

    container.innerHTML = products
        .map(
            (product, index) => `
      <img 
        class="item"
        src="${product.images?.[0] || "../../../../assets/img/no-image.png"}"
        data-index="${index}"
        alt="${product.itemName}"
      />
    `
        )
        .join("");
}

/* -------------------------------
   RENDER ONLY FIRST 4 CARDS
--------------------------------*/
function renderItemList() {
    const container = document.querySelector(".list-items");
    if (!container) return;
    container.innerHTML = "";

    const firstFour = allProducts.slice(0, 4);

    firstFour.forEach((product) => {
        const card = document.createElement("a");
        card.className = "card";
        card.href = "./c-detail-item.html";
        card.dataset.id = product.id;

        card.innerHTML = `
      <div class="img">
        <img src="${product.images?.[0] || "../../../../assets/img/no-image.png"}" />
      </div>
      <div class="card-header">
        <p class="name">${product.itemName}</p>
        <p class="price">$${product.price?.toFixed(2) || "0.00"}</p>
      </div>
      <p class="desc">${(product.description || "").slice(0, 30)}...</p>
      <p class="brand">${product.businessName}</p>
    `;

        card.addEventListener("click", () => {
            localStorage.setItem("selectedProduct", JSON.stringify(product));
        });

        container.appendChild(card);
    });
}

/* -------------------------------
   POPUP
--------------------------------*/
function renderSwipePopup(product) {
    document.getElementById("popupImage").src =
        product.images?.[0] || "../../../../assets/img/no-image.png";

    document.querySelector(".swipe-popup-title").textContent =
        product.itemName || "Unnamed Product";

    document.getElementById("swipePopupBrand").textContent =
        product.businessName || "Unknown Brand";

    document.getElementById("swipePopupDesc").textContent =
        product.description || "No description available.";

    document.querySelector(".swipe-popup-details").innerHTML = `
    <div class="swipe-detail-row">
      <strong>Price:</strong> $${product.price?.toFixed(2) || "0.00"}
    </div>
  `;
}

/* -------------------------------
   INITIAL LOAD
--------------------------------*/
async function initializePage(products) {
    allProducts = products;

    // Swipe items → shuffle
    swipeProducts = [...products];
    swipeProducts.sort(() => Math.random() - 0.5);

    // Load profile & business location (if needed later)
    const [businesses, profile] = await Promise.all([
        getAllBusinesses(),
        getCurrentUserProfile(),
    ]);

    customerProfile = profile;

    // Render UI
    renderItemList();
    renderSwipeItems(swipeProducts);

    if (swipeProducts.length > 0) {
        renderSwipePopup(swipeProducts[0]);
    }

    initializeSwipe(swipeProducts);
}

/* -------------------------------
   DOM READY
--------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    getAllProducts(initializePage);

    const popup = document.getElementById("swipePopup");
    const closeBtn = document.getElementById("closePopup");

    closeBtn.addEventListener("click", () => (popup.style.display = "none"));

    document.querySelector(".swipe-items").addEventListener("click", (e) => {
        if (e.target.classList.contains("item")) {
            const i = parseInt(e.target.dataset.index);
            renderSwipePopup(swipeProducts[i]);
            popup.style.display = "flex";
        }
    });
});
