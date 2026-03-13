/*
  @Made By: 
 */

import { HomePageService } from "../../services/business-side/HomePageService.js";

let productQuery = {};
let currentFilters = {};
let currentSort = 'recent';
let productContainer = null;

export function initializeProductList(containerElement, initialQuery = {}) {
  if (!containerElement) {
    console.error("[ProductListController] A container element is required for initialization.");
    return;
  }
  productContainer = containerElement;
  productQuery = initialQuery;
  
  window.addEventListener('filtersApplied', (event) => {
    console.log("[ProductListController] Received 'filtersApplied' event with data:", event.detail);
    handleFiltersApplied(event.detail);
  });
  
  window.addEventListener('sortApplied', (event) => {
    console.log("[ProductListController] Received 'sortApplied' event with data:", event.detail);
    handleSortApplied(event.detail.sortType);
  });
  
  fetchAndRenderProducts();
}

function handleFiltersApplied(filterState) {
  currentFilters = filterState;
  fetchAndRenderProducts();
}

function handleSortApplied(sortValue) {
  currentSort = sortValue;
  fetchAndRenderProducts();
}

async function fetchAndRenderProducts() {
  if (!productContainer) return;
  
  productContainer.innerHTML = "<p>Loading items...</p>";

  try {
    const finalQuery = { ...productQuery, filters: currentFilters, sort: currentSort };
    const products = await HomePageService.getFilteredProducts(finalQuery); 
    
    renderProducts(products);

  } catch (error) {
    console.error("[ProductListController] Failed to fetch or render products:", error);
    productContainer.innerHTML = "<p class='error'>Could not load items.</p>";
  }
}

function renderProducts(products) {
    if (!productContainer) return;

    if (!products || products.length === 0) {
        productContainer.innerHTML = "<p>No items found matching your criteria.</p>";
        return;
    }
    
    productContainer.innerHTML = products.map(product => {
        console.log(product);
        const formattedPrice = (typeof product.price === 'number' ? product.price : 0).toFixed(2);

        return `
        <div class="item-card" data-product-id="${product.id}">
            <a href="./b-detail-item.html?id=${product.id}" class="item-card__main-link" aria-label="View details for ${product.itemName}">
                <img src="${product.images[0] || "https://via.placeholder.com/300x400"}" alt="${product.itemName}" class="item-image">
                <div class="item-details">
                    <div class="item-header">
                        <span class="item-name">${product.itemName}</span>
                        <span class="item-price">$${formattedPrice}</span>
                    </div>
                </div>
            </a>
            <div class="item-footer">
                <p class="item-description">${product.description ? product.description.substring(0, 50) + "..." : ""}</p>
                <a href="./b-edit-item.html?id=${product.id}" class="edit-btn" aria-label="Edit item">
                    <img src="/assets/icons/Icon_pencil.svg" alt="Edit">
                </a>
            </div>
        </div>
        `;
    }).join('');
}