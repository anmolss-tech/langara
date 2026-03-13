/*
  @Revise By: Bella
 */
import {
  likeProduct,
  passProduct,
} from "../../../services/customer-side/UserService.js";

let allProducts = [];
let currentSwipeIndex = 0;
let swipePopupEl = null;

function renderTagGroup(label, attributes) {
  if (!attributes || (Array.isArray(attributes) && attributes.length === 0)) {
    return "";
  }

  const attrArray = Array.isArray(attributes) ? attributes : [attributes];

  return `
        <div class="swipe-detail-row">
            <span class="swipe-detail-label">${label}:</span>
            <div class="swipe-detail-values">
                ${attrArray
                  .map((attr) => `<span class="swipe-text-tag">${attr}</span>`)
                  .join("")}
            </div>
        </div>
    `;
}

function renderSwipePopup() {
  const product = allProducts[currentSwipeIndex];
  if (!product) return;

  swipePopupEl.querySelector("#popupImage").src =
    product.images?.[0] || "../../../../assets/img/no-image.png";
  swipePopupEl.querySelector(".swipe-popup-title").textContent =
    product.itemName || "Unnamed Product";
  swipePopupEl.querySelector("#swipePopupBrand").textContent =
    product.businessName || "Unknown Brand";
  swipePopupEl.querySelector("#swipePopupDesc").textContent =
    product.description || "No description available.";

  const detailsContainer = swipePopupEl.querySelector(".swipe-popup-details");
  detailsContainer.innerHTML = `
        ${renderTagGroup("Colour", product.colors)}
        ${renderTagGroup("Size", product.sizes)}
        ${renderTagGroup("Recommend season", product.season)}
        ${renderTagGroup("Texture", product.texture)}
        ${renderTagGroup("Material", product.material)}
        ${renderTagGroup("Style", product.styles)}
    `;
}

function showSwipePopup(index) {
  currentSwipeIndex = index;
  renderSwipePopup();
  swipePopupEl.style.display = "flex";
}

function hideSwipePopup() {
  swipePopupEl.style.display = "none";
}

function loadNextProduct() {
  currentSwipeIndex = (currentSwipeIndex + 1) % allProducts.length;
  renderSwipePopup();
}

export function initializeSwipe(products) {
  if (!products || products.length === 0) return;
  allProducts = products;

  const swipeItemsContainer = document.querySelector(".swipe-items");
  swipePopupEl = document.getElementById("swipePopup");
  const closeBtn = swipePopupEl.querySelector("#closePopup");
  const passBtn = swipePopupEl.querySelector(".swipe-btn-pass");
  const likeBtn = swipePopupEl.querySelector(".swipe-btn-like");

  const leftArrow = document.querySelector(".swipe-arrow.left");
  const rightArrow = document.querySelector(".swipe-arrow.right");

  if (leftArrow) {
    leftArrow.addEventListener("click", () => {
      currentSwipeIndex =
        (currentSwipeIndex - 1 + allProducts.length) % allProducts.length;
      renderSwipePopup();

      swipeItemsContainer.scrollLeft -= 200;
    });
  }

  if (rightArrow) {
    rightArrow.addEventListener("click", () => {
      currentSwipeIndex = (currentSwipeIndex + 1) % allProducts.length;
      renderSwipePopup();

      swipeItemsContainer.scrollLeft += 200;
    });
  }

  swipeItemsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("item")) {
      showSwipePopup(parseInt(e.target.dataset.index, 10));
    }
  });

  closeBtn.addEventListener("click", hideSwipePopup);
  swipePopupEl.addEventListener("click", (e) => {
    if (e.target === swipePopupEl) hideSwipePopup();
  });

  passBtn.addEventListener("click", () => {
    const currentProduct = allProducts[currentSwipeIndex];
    if (currentProduct) {
      passProduct(currentProduct);
    }
    loadNextProduct();
  });

  likeBtn.addEventListener("click", () => {
    const currentProduct = allProducts[currentSwipeIndex];
    if (currentProduct) {
      likeProduct(currentProduct);
    }
    loadNextProduct();
  });
}
