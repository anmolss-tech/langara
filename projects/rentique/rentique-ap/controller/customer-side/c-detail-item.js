/*
  @Revised By: Rika
 */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"; 
import { auth } from "../../../services/business-side/firebase-init.js";
import { ChatService } from "../../../services/customer-side/ChatService.js";
import { getBusinessById } from "../../../services/customer-side/BusinessService.js"; 
import { getCurrentUserProfile } from "../../../services/customer-side/UserService.js"; 
import { showModal } from "../../../controller/components/modal.js"; 
import { GOOGLE_MAPS_API_KEY } from "../../../services/business-side/firebase-config.js";

let currentProduct = null;
let currentImageIndex = 0;
let autoSlideInterval = null;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

async function displayLocationInfo(businessId) {
  const distanceText = document.getElementById("distance-text");
  const useCurrentLocationBtn = document.getElementById(
    "use-current-location-btn"
  );
  const locationMap = document.getElementById("location-map");
  const directionsLink = document.getElementById("directions-link");
  if (
    !distanceText ||
    !useCurrentLocationBtn ||
    !locationMap ||
    !directionsLink
  )
    return;

  distanceText.textContent = "Calculating distance...";

  try {
    const businessData = await getBusinessById(businessId);
    if (!businessData?.location?.geopoint) {
      distanceText.textContent = "Location information unavailable.";
      return;
    }
    const businessCoords = businessData.location.geopoint;
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${businessCoords.latitude},${businessCoords.longitude}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7Clabel:B%7C${businessCoords.latitude},${businessCoords.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    locationMap.src = mapUrl;
    locationMap.style.display = "block";

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${businessCoords.latitude},${businessCoords.longitude}`;
    directionsLink.href = directionsUrl;

    const getDeviceLocation = (isRetry = false) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = position.coords;
          const distance = calculateHaversineDistance(
            userCoords.latitude,
            userCoords.longitude,
            businessCoords.latitude,
            businessCoords.longitude
          );
          distanceText.innerHTML = `Approximately <strong>${distance} km away</strong> from your current location.`;
          useCurrentLocationBtn.style.display = "none";
        },
        async () => {
          const userProfile = await getCurrentUserProfile();
          if (userProfile?.location?.geopoint) {
            const savedCoords = userProfile.location.geopoint;
            const distance = calculateHaversineDistance(
              savedCoords.latitude,
              savedCoords.longitude,
              businessCoords.latitude,
              businessCoords.longitude
            );
            distanceText.innerHTML = `Approximately <strong>${distance} km away</strong> from your saved address.`;
            useCurrentLocationBtn.style.display = "block";
          } else {
            distanceText.textContent =
              "Enable location or save an address to see the distance.";
            useCurrentLocationBtn.style.display = "block";
          }
          if (isRetry) {
            showModal(
              "Location Access Blocked",
              "To use this feature, enable location access in your browser's site settings.",
              { confirmText: "OK", iconType: "warning" }
            );
          }
        }
      );
    };

    useCurrentLocationBtn.addEventListener("click", async () => {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });
      if (permissionStatus.state === "denied") {
        showModal(
          "Location Access Blocked",
          "You have previously denied location access. To use this feature, please enable it in your browser's site settings (usually the lock icon in the address bar).",
          { confirmText: "OK", iconType: "warning" }
        );
      } else {
        getDeviceLocation(true);
      }
    });

    getDeviceLocation();
  } catch (error) {
    console.error("Failed to display location info:", error);
    distanceText.textContent = "Could not load location information.";
  }
}

function loadProductFromStorage() {
  const productJSON = localStorage.getItem("selectedProduct");
  if (!productJSON) {
    console.error("No product data found in localStorage.");
    document.querySelector(".summ-details").innerHTML =
      "<h2>Product not found</h2><p>Please go back and select a product.</p>";
    const gallery = document.getElementById("galleryContainer");
    if (gallery) gallery.style.display = "none";
    return;
  }
  currentProduct = JSON.parse(productJSON);
  renderProductDetails();
}

function renderAttributes(containerId, attributes) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const attrs = Array.isArray(attributes)
    ? attributes
    : attributes
    ? [attributes]
    : [];
  if (attrs.length > 0) {
    container.innerHTML = attrs
      .map((attr) => `<span class="summ-tag">${attr}</span>`)
      .join("");
  } else {
    container.innerHTML = `<span class="summ-tag-none">Not specified</span>`;
  }
}

function renderTags(containerId, tags, type = "default") {
  const container = document.getElementById(containerId);

  if (!container || !Array.isArray(tags) || tags.length === 0) {
    if (container) container.innerHTML = '<span class="summ-tag">N/A</span>';
    return;
  }

  container.innerHTML = tags
    .filter((tag) => tag)
    .map((tag) => {
      if (type === "color") {
        return `<span class="summ-tag summ-tag--color"><span class="summ-color-dot summ-color-dot--${String(
          tag
        )
          .toLowerCase()
          .replace(/\s+/g, "")}"></span> ${tag}</span>`;
      }
      return `<span class="summ-tag">${tag}</span>`;
    })
    .join("");
}

function renderProductDetails() {
  if (!currentProduct) return;
  document.getElementById("dispItemName").textContent =
    currentProduct.itemName || "Unnamed Product";
  document.getElementById("dispItemPrice").textContent = currentProduct.price
    ? `$${currentProduct.price.toFixed(2)}`
    : "$0.00";
  document.getElementById("dispItemDesc").textContent =
    currentProduct.description || "No description available.";
  document.getElementById("dispBusinessName").textContent =
    currentProduct.businessName || "Unknown Brand";
  console.log("currentProduct");
  console.log(currentProduct);
  renderGallery();
  renderTags("dispColors", currentProduct.colors, "color");
  renderAttributes("dispSizes", currentProduct.sizes);
  renderAttributes("dispStyle", currentProduct.style);
  renderAttributes("dispMaterial", currentProduct.material);
  renderAttributes("dispTexture", currentProduct.texture);
  renderAttributes("dispSeason", currentProduct.season);
  renderAttributes("dispCategory", currentProduct.category);
  renderAttributes("dispSizeFit", currentProduct.sizeFit);
  const genderContainer = document.getElementById("dispGender");
  if (genderContainer && currentProduct.gender) {
    genderContainer.innerHTML = `<span class="summ-tag">${currentProduct.gender}</span>`;
  }
  const sizeChartContainer = document.getElementById("sizeChartContainer");
  if (sizeChartContainer && currentProduct.measurementTableUrl) {
    const sizeChartImage = document.getElementById("dispSizeChart");
    sizeChartImage.src = currentProduct.measurementTableUrl;
    document.getElementById("sizechart-viewer-img").src =
      currentProduct.measurementTableUrl;
    sizeChartContainer.style.display = "block";
  }
}

function stopAutoSlide() {
  clearInterval(autoSlideInterval);
}

function startAutoSlide() {
  stopAutoSlide();
  const imageCount = currentProduct?.images?.length || 0;
  if (imageCount <= 1) return;
  autoSlideInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % imageCount;
    updateGallery();
  }, 3000);
}

function renderGallery() {
  const sliderWrapper = document.querySelector(".summ-gallery__slider-wrapper");
  const dotsContainer = document.querySelector(".summ-gallery__dots");
  if (!sliderWrapper || !dotsContainer) return;
  const images = currentProduct.images || [];
  if (images.length === 0) {
    sliderWrapper.innerHTML = `<div class="summ-gallery__slide"><img src="../../../../assets/img/no-image.png" alt="No image" class="summ-gallery__img"></div>`;
    return;
  }
  sliderWrapper.innerHTML = images
    .map(
      (imgUrl) =>
        `<div class="summ-gallery__slide"><img src="${imgUrl}" alt="${currentProduct.itemName}" class="summ-gallery__img"></div>`
    )
    .join("");
  dotsContainer.innerHTML = images
    .map(
      (_, index) =>
        `<button class="summ-gallery__dot" data-index="${index}" aria-label="Go to image ${
          index + 1
        }"></button>`
    )
    .join("");
  dotsContainer.querySelectorAll(".summ-gallery__dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      stopAutoSlide();
      currentImageIndex = parseInt(dot.dataset.index);
      updateGallery();
      startAutoSlide();
    });
  });
  updateGallery();
  startAutoSlide();
}

function updateGallery() {
  const sliderWrapper = document.querySelector(".summ-gallery__slider-wrapper");
  const dots = document.querySelectorAll(".summ-gallery__dot");
  const imageCount = currentProduct.images?.length || 0;
  if (!sliderWrapper || imageCount === 0) return;
  sliderWrapper.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  dots.forEach((dot, index) =>
    dot.classList.toggle("active", index === currentImageIndex)
  );
  const arrowsVisible = imageCount > 1;
  const prevArrow = document.querySelector(".summ-gallery__arrow.prev");
  const nextArrow = document.querySelector(".summ-gallery__arrow.next");
  if (prevArrow) prevArrow.style.display = arrowsVisible ? "flex" : "none";
  if (nextArrow) nextArrow.style.display = arrowsVisible ? "flex" : "none";
}

async function handleChatWithOwner() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to chat with the owner.");
    window.location.href = `./auth-login-customer.html?redirect=${window.location.pathname}`;
    return;
  }
  if (!currentProduct || !currentProduct.profileID) {
    alert("Could not start chat. Product information is incomplete.");
    return;
  }
  if (user.uid === currentProduct.profileID) {
    alert("This is your own item. You cannot start a chat with yourself.");
    return;
  }
  const productContext = {
    productId: currentProduct.id,
    itemName: currentProduct.itemName,
    imageUrl: currentProduct.images?.[0] || "",
  };
  try {
    const chatId = await ChatService.findOrCreateChat(
      user.uid,
      currentProduct.profileID,
      productContext
    );
    window.location.href = `./c-chat.html?id=${chatId}`;
  } catch (error) {
    console.error("Error initiating chat:", error);
    alert("Could not start chat. Please try again later.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductFromStorage();
  const chatButton = document.getElementById("chatWithOwnerBtn");
  if (chatButton) chatButton.addEventListener("click", handleChatWithOwner);
  const gallery = document.getElementById("galleryContainer");
  const prevArrow = document.querySelector(".summ-gallery__arrow.prev");
  const nextArrow = document.querySelector(".summ-gallery__arrow.next");
  if (prevArrow && nextArrow) {
    prevArrow.addEventListener("click", () => {
      stopAutoSlide();
      const imageCount = currentProduct.images?.length || 0;
      if (imageCount === 0) return;
      currentImageIndex = (currentImageIndex - 1 + imageCount) % imageCount;
      updateGallery();
      startAutoSlide();
    });
    nextArrow.addEventListener("click", () => {
      stopAutoSlide();
      const imageCount = currentProduct.images?.length || 0;
      if (imageCount === 0) return;
      currentImageIndex = (currentImageIndex + 1) % imageCount;
      updateGallery();
      startAutoSlide();
    });
  }
  if (gallery) {
    gallery.addEventListener("mouseenter", stopAutoSlide);
    gallery.addEventListener("mouseleave", startAutoSlide);
  }
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Auth state confirmed: User is logged in.", user.uid);
      if (currentProduct && currentProduct.businessID) {
        displayLocationInfo(currentProduct.businessID);
      }
    } else {
      console.log("Auth state confirmed: User is logged out.");
      const distanceText = document.getElementById("distance-text");
      if (distanceText) {
        distanceText.innerHTML = `<a href="./auth-login-customer.html">Log in</a> to see distance information.`;
      }
    }
  });
});

//UPDATE
function toggleDropdown(el) {
  const group = el.closest(".summ-attr-group");
  if (window.innerWidth > 779) return;
  group.classList.toggle("show");
}

function setDropdownState() {
  const groups = document.querySelectorAll(".summ-attr-group[data-dropdown]");
  if (window.innerWidth > 779) {
    groups.forEach((g) => g.classList.add("show"));
  } else {
    groups.forEach((g) => g.classList.remove("show"));
  }
}

window.addEventListener("resize", setDropdownState);
document.addEventListener("DOMContentLoaded", setDropdownState);
window.toggleDropdown = toggleDropdown;
