 /*
  @Made By:  
 */
import { auth } from "../../../services/business-side/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { ProductService } from "../../../services/business-side/ProductService.js";
import { showModal } from "../../controller/components/modal.js";

console.log("[b-detail-item.js] Script execution started.");

document.addEventListener("DOMContentLoaded", () => {
  console.log("[b-detail-item.js] DOM fully loaded. Setting up auth guard.");
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("[b-detail-item.js] User is authenticated. Initializing page...");
      initializeApp(user);
    } else {
      console.log("[b-detail-item.js] User is NOT authenticated. Redirecting to login.");
      window.location.href = "./auth-login-business.html";
    }
  });
});

async function initializeApp(user) {
  console.log("[b-detail-item.js] initializeApp() called.");

  const productId = getProductIdFromUrl();

  if (!productId) {
    console.error("[b-detail-item.js] FATAL: No product ID found in the URL.");
    handleInvalidProduct("No product ID was provided in the URL. Cannot display item.");
    return;
  }

  console.log(`[b-detail-item.js] Found Product ID: ${productId}. Fetching data...`);

  try {
    const product = await ProductService.getProductById(productId);
    console.log(product);

    if (!product) {
      console.error(`[b-detail-item.js] FATAL: Product with ID ${productId} not found in Firestore.`);
      handleInvalidProduct(`The requested product could not be found. It may have been deleted.`);
      return;
    }

    console.log("[b-detail-item.js] Product data fetched successfully. Populating page...");
    populateProductDetails(product);
    setupEventListeners(product);

  } catch (error) {
    console.error("[b-detail-item.js] An error occurred during product fetch:", error);
    handleInvalidProduct("A network or database error occurred while fetching product data.");
  }
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  console.log(`[b-detail-item.js] Parsing URL. Found id = ${id}`);
  return id;
}

function handleInvalidProduct(message) {
  console.warn(`[b-detail-item.js] handleInvalidProduct called with message: "${message}"`);
  const detailsSection = document.querySelector(".summ-details");
  if (detailsSection) {
    const gallerySection = document.querySelector(".summ-gallery");
    if(gallerySection) gallerySection.innerHTML = '';

    detailsSection.innerHTML = `
      <div style="padding: 2rem; max-width: 600px; margin: auto;">
        <h2>Error Loading Product</h2>
        <p style="margin-top: 1rem; margin-bottom: 1.5rem;">${message}</p>
        <a href="./b-home.html" style="text-decoration: underline; color: #06324f; font-weight: 500;">Return to your inventory</a>
      </div>
    `;
  }
}

function populateProductDetails(product) {
  const formattedPrice = (typeof product.price === 'number' ? product.price : 0).toFixed(2);

  document.getElementById("dispItemName").textContent = product.itemName || "Unnamed Item";
  document.getElementById("dispItemPrice").textContent = `$${formattedPrice || 0}`;
  document.getElementById("dispItemDesc").textContent = product.description || "No description provided.";

 
  const galleryContainer = document.getElementById("galleryContainer");
  if (product.images && product.images.length > 0) {
    const sliderHtml = `
      <div class="summ-gallery__slider-wrapper">
        ${product.images.map(imgUrl => `
          <div class="summ-gallery__slide">
            <img src="${imgUrl}" alt="${product.itemName}" class="summ-gallery__img">
          </div>
        `).join('')}
      </div>
      <div class="summ-gallery__dots">
        ${product.images.map((_, index) => `
          <span class="summ-gallery__dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
        `).join('')}
      </div>
    `;
    galleryContainer.innerHTML = sliderHtml;
    initializeImageSlider();
  } else {
    galleryContainer.innerHTML = `<img src="https://via.placeholder.com/600x800?text=No+Image" alt="No Image" class="summ-gallery__img">`;
  }
  
  
  console.log(`116: product`)
  console.log(product)
  renderTags("dispColors", product.colors, 'color');
  renderTags("dispSizes", product.sizes);
  renderTags("dispSizeFit", [product.sizeFit]);
  renderTags("dispCategory", product.category);
  
  renderTags("dispGender", [product.gender]);
  renderTags("dispMaterial", product.material);
  renderTags("dispTexture", product.texture);
  renderTags('dispSeason', product.season); 
  renderTags("dispStyle", product.style);

  
  if (product.measurementTableUrl) {
    document.getElementById("sizeChartContainer").style.display = "block";
    document.getElementById("dispSizeChart").src = product.measurementTableUrl;
  }
}

function renderTags(containerId, tags, type = 'default') {
    const container = document.getElementById(containerId);
   
    if (!container || !Array.isArray(tags) || tags.length === 0) {
      console.log(containerId)
        if(container) container.innerHTML = '<span class="summ-tag">N/A</span>';
        return;
    }
    
    container.innerHTML = tags.filter(tag => tag).map(tag => {
        if (type === 'color') {
            return `<span class="summ-tag summ-tag--color"><span class="summ-color-dot summ-color-dot--${String(tag).toLowerCase().replace(/\s+/g, '')}"></span> ${tag}</span>`;
        }
        return `<span class="summ-tag">${tag}</span>`;
    }).join('');
}

function setupEventListeners(product) {
    const editBtn = document.getElementById('editItemBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = `./b-edit-item.html?id=${product.id}`;
        });
    }



    const deleteBtn = document.getElementById('deleteItemBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            
            showModal(
                "Are you sure you want to delete this item?", 
                `"${product.itemName}" will be permanently removed. This action cannot be undone.`,
                { 
                    confirmText: 'DELETE',
                    cancelText: 'CANCEL',
                    iconType: "delete", 
                    onConfirm: async () => {
                        try {
                            await ProductService.deleteProductById(product.id);
                            showModal("Success", "Product has been successfully deleted.", { confirmText: 'OK' });
                            
                            window.location.href = "./b-home.html";
                        } catch (error) {
                            console.error("Failed to delete product:", error);
                            showModal("Error", "Could not delete the product. Please try again.", { confirmText: 'OK' });
                        }
                    }
                }
            );
        });
    }
}

function initializeImageSlider() {
    const gallery = document.querySelector('.summ-gallery');
    if (!gallery) return;

    const slider = gallery.querySelector('.summ-gallery__slider-wrapper');
    const dots = gallery.querySelectorAll('.summ-gallery__dot');
    
    if (!slider || dots.length <= 1) { 
        return;
    }

    let currentIndex = 0;
    const totalSlides = dots.length;
    let autoSlideInterval; 

    function goToSlide(index) {
        
        const newIndex = (index + totalSlides) % totalSlides;
        slider.style.transform = `translateX(-${newIndex * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[newIndex].classList.add('active');
        currentIndex = newIndex;
    }
    function startAutoSlide() {
        stopAutoSlide(); 
        autoSlideInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 1200); 
    }
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            goToSlide(parseInt(e.target.dataset.slide));
        });
    });

    gallery.addEventListener('mouseenter', stopAutoSlide);
    gallery.addEventListener('mouseleave', startAutoSlide);
    startAutoSlide();
}