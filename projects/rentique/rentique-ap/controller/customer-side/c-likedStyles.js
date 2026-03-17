/*
  @Revised by Rika: 
 */
import { profileService } from "../../services/customer-side/ProfileService.js";
import { processProducts } from "../../services/customer-side/ProductProcessor.js";
import { getAllBusinesses } from "../../services/customer-side/BusinessService.js";
import { showModal } from "../components/modal.js";

let allLikedProducts = [];
let displayedProducts = [];
let activeFilters = {};
let activeSort = "recent";
let currentPage = 1;
const productsPerPage = 12;
const businessLocationMap = new Map();
let customerProfile = null;

const container = document.getElementById("liked-items-container");
const paginationContainer = document.getElementById(
  "liked-pagination-controls"
);

function updateAndRender() {
  const customerLocation = customerProfile?.location?.geopoint
    ? {
      lat: customerProfile.location.geopoint.latitude,
      lon: customerProfile.location.geopoint.longitude,
    }
    : null;
  displayedProducts = processProducts(
    allLikedProducts,
    activeFilters,
    activeSort,
    customerLocation,
    businessLocationMap
  );
  currentPage = 1;

  renderLikedItems();
  renderPaginationControls();
}

function renderLikedItems() {
  if (!container) return;

  if (displayedProducts.length === 0) {
    container.innerHTML = "<p>No items match your criteria.</p>";
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productsToShow = displayedProducts.slice(startIndex, endIndex);

  container.innerHTML = productsToShow
    .map(
      (product) => `
      <div class="card" style="position:relative">
        <a href="./c-detail-item.html" class="card-link" data-product-id="${product.id}">
          <div class="img">
            <img
              src="${product.images?.[0] || "../../../../assets/img/no-image.png"}"
              alt="${product.itemName || "Product"}"
            />
          </div>
          <div class="card-header">
            <p class="name">${product.itemName || "Unnamed Product"}</p>
          </div>
          <p class="desc">${product.description
          ? product.description.substring(0, 30) + "..."
          : ""
        }</p>
          <p class="brand">${product.businessName || "Unknown Brand"}</p>
        </a>
        <button class="remove-liked-btn" data-product-id="${product.id}" 
          aria-label="Remove ${product.itemName}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40.59 40.59">
          <path d="M25.28,20.3l14.28-14.28c1.38-1.37,1.38-3.61,0-4.98-1.38-1.38-3.61-1.38-4.98,0l-14.28,14.28L6.01,1.03C4.64-.34,2.41-.34,1.03,1.03-.34,2.41-.34,4.64,1.03,6.01l14.28,14.28L1.03,34.58c-1.38,1.37-1.38,3.61,0,4.98.69.69,1.59,1.03,2.49,1.03s1.8-.34,2.49-1.03l14.28-14.28,14.28,14.28c.69.69,1.59,1.03,2.49,1.03s1.8-.34,2.49-1.03c1.38-1.37,1.38-3.61,0-4.98l-14.28-14.28Z"/>
          </svg>
        </button>
      </div>
    `
    )
    .join("");

  // Keep same click → detail logic
  container.querySelectorAll(".card-link").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const product = allLikedProducts.find(
        (p) => p.id === card.dataset.productId
      );
      if (product) {
        localStorage.setItem("selectedProduct", JSON.stringify(product));
        window.location.href = card.href;
      }
    });
  });
}


function renderPaginationControls() {
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

async function handleRemoveLikedItem(productId) {
  showModal(
    "Remove Item",
    "Are you sure you want to remove this item from your liked list?",
    {
      iconType: "delete",
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await profileService.removeLikedProduct(productId);

          // Update both lists and re-render
          allLikedProducts = allLikedProducts.filter((p) => p.id !== productId);
          updateAndRender();

          console.log(`Successfully removed product ${productId}`);
        } catch (error) {
          console.error("Error removing liked item:", error);
          showModal("Error", "Failed to remove item. Please try again.", {
            iconType: "warning",
            confirmText: "OK",
          });
        }
      },
    }
  );
}

export async function initializeLikedItems(userProfile) {
  if (!container) {
    console.error("Liked items container not found.");
    return;
  }

  container.innerHTML = "<p>Loading liked items...</p>";
  customerProfile = userProfile;

  try {
    const productIds = userProfile.likedProductIDs || [];
    const [products, businesses] = await Promise.all([
      profileService.getLikedProducts(productIds),
      getAllBusinesses(),
    ]);

    allLikedProducts = products;
    businesses.forEach((biz) => {
      if (biz.location?.geopoint) {
        businessLocationMap.set(biz.id, {
          lat: biz.location.geopoint.latitude,
          lon: biz.location.geopoint.longitude,
        });
      }
    });

    updateAndRender();
  } catch (error) {
    console.error("Failed to initialize liked items:", error);
    container.innerHTML = "<p>Could not load your liked items.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const filterBtn = document.getElementById("liked-filter-btn");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      openFilterModal();
    });
  }

  const sortBtn = document.getElementById("liked-sort-btn");
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      openSortModal(sortBtn);
    });
  }

  window.addEventListener("filtersApplied", (e) => {
    const rawFilters = e.detail;
    const correctedFilters = {
      ...rawFilters,
      styles: rawFilters.style || [],
      sizes: rawFilters.size || [],
    };

    delete correctedFilters.style;
    delete correctedFilters.size;

    activeFilters = correctedFilters;
    console.log("[v0] Filters applied to liked items:", activeFilters);
    updateAndRender();
  });

  window.addEventListener("sortApplied", (e) => {
    activeSort = e.detail.sortType;
    console.log("[v0] Sort applied to liked items:", activeSort);
    updateAndRender();
  });

  if (paginationContainer) {
    paginationContainer.addEventListener("click", (e) => {
      if (e.target.matches(".page-btn")) {
        currentPage = Number.parseInt(e.target.dataset.page, 10);
        renderLikedItems();
        renderPaginationControls();
        document
          .getElementById("liked-section")
          .scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
});

document.addEventListener("click", (e) => {
  if (e.target.matches(".remove-liked-btn")) {
    const productId = e.target.dataset.productId;
    handleRemoveLikedItem(productId);
  }
});
