/*
  @Revised By: Rika, carlos
 */
import { getAllProducts } from "../../services/customer-side/ProductService.js";
import {
  getCurrentUserProfile,
  likeProduct,
  passProduct,
} from "../../services/customer-side/UserService.js";
import { getAllBusinesses } from "../../services/customer-side/BusinessService.js";
import { processProducts } from "../../services/customer-side/ProductProcessor.js";
import { initializeSwipe } from "../components/swipeComponent.js";

let allProducts = [];
let businessLocationMap = new Map();
let customerProfile = null;
let displayedProducts = [];
let activeFilters = {};
let activeSort = "recent";
let currentSwipeIndex = 0;
let swipeProducts = []; //UPDATE
const productsPerPage = 12;
let currentPage = 1;

//UPDATE
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function updateAndRender() {
  const customerLocation = customerProfile?.location?.geopoint
    ? {
      lat: customerProfile.location.geopoint.latitude,
      lon: customerProfile.location.geopoint.longitude,
    }
    : null;

  displayedProducts = processProducts(
    allProducts,
    activeFilters,
    activeSort,
    customerLocation,
    businessLocationMap
  );
  console.log(displayedProducts);
  currentPage = 1;

  renderItemList();
  renderPaginationControls();
}

/* UPDATE */
function renderSwipeItems(products) {
  const swipeItemsContainer = document.querySelector(".swipe-items");
  if (!swipeItemsContainer) return;

  swipeItemsContainer.innerHTML = products
    .map(
      (product, index) => `
      <img class="item"
           src="${product.images?.[0] || "../../../../assets/img/no-image.png"}"
           alt="${product.itemName}"
           data-index="${index}" />
    `
    )
    .join("");
}
//UPDATE
function renderItemList() {
  const listItemsContainer = document.querySelector(".list-items");
  if (!listItemsContainer) return;
  listItemsContainer.innerHTML = "";

  if (displayedProducts.length === 0) {
    listItemsContainer.innerHTML = "<p>No items match your criteria.</p>";
    return;
  }

  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productsToShow = displayedProducts.slice(startIndex, endIndex);

  productsToShow.forEach((product) => {
    const globalIndex = allProducts.findIndex((p) => p.id === product.id);
    const cardElement = document.createElement("a");
    cardElement.href = "./c-detail-item.html";
    cardElement.className = "card";
    cardElement.dataset.index = globalIndex;
    cardElement.innerHTML = `
          <div class="img">
            <img src="${product.images?.[0] || "../../../../assets/img/no-image.png"
      }" alt="${product.itemName}" />
          </div>
          <div class="card-header">
          <p class="name">${product.itemName || "Unnamed Product"}</p>
          <p class="price">$${product.price ? product.price.toFixed(2) : "0.00"
      }</p>
      </div>
          <p class="desc">${product.description
        ? product.description.substring(0, 30) + "..."
        : ""
      }</p>
      <p class="brand">${product.businessName || "Unknown Brand"}</p>
      `;
    listItemsContainer.appendChild(cardElement);
  });
  attachCardEventListeners();
}

function renderPaginationControls() {
  const paginationContainer = document.getElementById("paginationControls");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(displayedProducts.length / productsPerPage);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.className = `page-btn ${i === currentPage ? "active" : ""}`;
    button.dataset.page = i;
    button.textContent = i;
    paginationContainer.appendChild(button);
  }
}

function renderSwipePopup(product) {
  if (!product) return;
  document.getElementById("popupImage").src =
    product.images?.[0] || "../../../../assets/img/no-image.png";
  document.querySelector(".swipe-popup-title").textContent =
    product.itemName || "Unnamed Product";
  document.getElementById("swipePopupBrand").textContent =
    product.businessName || "Unknown Brand";
  document.getElementById("swipePopupDesc").textContent =
    product.description || "No description available.";
  const detailsContainer = document.querySelector(".swipe-popup-details");
  if (!detailsContainer) return;
  detailsContainer.innerHTML = `
          <div class="swipe-detail-row">...</div>
      `;
}

// REVISED
function showSwipePopup() {
  const popup = document.getElementById("swipePopup");
  if (popup) popup.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function hideSwipePopup() {
  const popup = document.getElementById("swipePopup");
  if (popup) popup.style.display = "none";
  document.body.style.overflow = "";
}

//REVISED
function loadNextSwipeProduct() {
  if (swipeProducts.length === 0) return;
  currentSwipeIndex = (currentSwipeIndex + 1) % swipeProducts.length;
  const nextProduct = swipeProducts[currentSwipeIndex];
  renderSwipePopup(nextProduct);
}

function attachCardEventListeners() {
  document.querySelectorAll(".list-items .card").forEach((card) => {
    card.addEventListener("click", handleCardClick);
  });
}

function handleCardClick(event) {
  event.preventDefault();
  const card = event.currentTarget;
  const product = allProducts[card.dataset.index];
  if (product) {
    localStorage.setItem("selectedProduct", JSON.stringify(product));
    window.location.href = card.href;
  }
}

// UPDATE
async function initializePage(products) {
  allProducts = products;
  swipeProducts = [...products];
  shuffleArray(swipeProducts);

  const [businesses, profile] = await Promise.all([
    getAllBusinesses(),
    getCurrentUserProfile(),
  ]);
  customerProfile = profile;

  businesses.forEach((biz) => {
    if (biz.location?.geopoint) {
      businessLocationMap.set(biz.id, {
        lat: biz.location.geopoint.latitude,
        lon: biz.location.geopoint.longitude,
      });
    }
  });
  console.log("All data initialized.", {
    products: allProducts.length,
    businesses: businessLocationMap.size,
    profile,
  });
  updateAndRender();
  renderSwipeItems(swipeProducts);
  if (swipeProducts.length > 0) {
    currentSwipeIndex = 0;
    renderSwipePopup(swipeProducts[0]);
  }
  initializeSwipe(swipeProducts);
}

document.addEventListener("DOMContentLoaded", () => {
  getAllProducts(initializePage);
  document
    .querySelector(".filter-btn")
    .addEventListener("click", () => openFilterModal());
  document
    .querySelector(".sort-btn")
    .addEventListener("click", () =>
      openSortModal(document.querySelector(".sort-btn"))
    );

  window.addEventListener("filtersApplied", (e) => {
    console.log(
      "FIX: Added adapter logic to correct the filter object structure."
    );
    const rawFilters = e.detail;
    console.log("Received raw filters from modal:", rawFilters);
    const correctedFilters = {
      ...rawFilters,
      styles: rawFilters.style || [],
      sizes: rawFilters.size || [],
    };

    delete correctedFilters.style;
    delete correctedFilters.size;

    activeFilters = correctedFilters;
    console.log("Corrected filters and applying:", activeFilters);

    updateAndRender();
  });

  window.addEventListener("sortApplied", (e) => {
    const sortValue = e.detail.sortType;
    activeSort = sortValue;
    console.log("Sort Changed:", activeSort);
    updateAndRender();
  });

  document
    .getElementById("paginationControls")
    .addEventListener("click", (e) => {
      if (e.target.matches(".page-btn")) {
        currentPage = parseInt(e.target.dataset.page, 10);
        renderItemList();
        renderPaginationControls();
      }
    });

  const swipeItemsContainer = document.querySelector(".swipe-items");
  const closeBtn = document.getElementById("closePopup");
  const passBtn = document.querySelector(".swipe-btn-pass");
  const likeBtn = document.querySelector(".swipe-btn-like");
  const popup = document.getElementById("swipePopup");
  const leftArrow = document.querySelector(".arrow.left");
  const rightArrow = document.querySelector(".arrow.right");

  if (leftArrow && rightArrow && swipeItemsContainer) {
    leftArrow.addEventListener("click", () => {
      swipeItemsContainer.scrollLeft -= 320;
    });

    rightArrow.addEventListener("click", () => {
      swipeItemsContainer.scrollLeft += 320;
    });
  }

  /* UPDATE */
  if (swipeItemsContainer) {
    swipeItemsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("item")) {
        currentSwipeIndex = parseInt(e.target.dataset.index, 10);
        renderSwipePopup(swipeProducts[currentSwipeIndex]);
        showSwipePopup();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", hideSwipePopup);
  }
  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) hideSwipePopup();
    });
  }

  /* UPDATE */
  if (passBtn) {
    passBtn.addEventListener("click", () => {
      const p = swipeProducts[currentSwipeIndex];
      if (p) passProduct(p);
      loadNextSwipeProduct();
    });
  }

  if (likeBtn) {
    likeBtn.addEventListener("click", () => {
      const p = swipeProducts[currentSwipeIndex];
      if (p) likeProduct(p);
      loadNextSwipeProduct();
    });
  }
});

