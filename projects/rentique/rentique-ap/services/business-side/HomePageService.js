/*
  @Made By: Anmol Singh
 */
import { firestore } from "./firebase-init.js";
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


async function getFilteredProducts(queryObj = {}) {
  const { businessId, filters = {}, sort = 'recent' } = queryObj;
  
  const productsRef = collection(firestore, "products");
  let q = query(productsRef);

 
  if (businessId) {
    q = query(q, where("businessID", "==", businessId));
  }
  
  let categoryWasFilteredOnBackend = false;
  let genderWasFilteredOnBackend = false;

  
  if (filters.category && filters.category.length > 0) {
    q = query(q, where("category", "array-contains-any", filters.category));
    categoryWasFilteredOnBackend = true;
  } else if (filters.gender && filters.gender.length > 0) {
    q = query(q, where("gender", "in", filters.gender));
    genderWasFilteredOnBackend = true;
  }

  
  const hasPriceFilter = filters.price_min > 1 || filters.price_max < 120;
  if (hasPriceFilter) {
      if (filters.price_min) {
        q = query(q, where("price", ">=", filters.price_min));
      }
      if (filters.price_max) {
        q = query(q, where("price", "<=", filters.price_max));
      }
  }

  
  if (hasPriceFilter) {
      if (sort === 'high-to-low') {
          q = query(q, orderBy("price", "desc"));
      } else {
          q = query(q, orderBy("price", "asc"));
      }
      q = query(q, orderBy("createdAt", "desc"));
  } else {
      if (sort === 'high-to-low') {
          q = query(q, orderBy("price", "desc"));
      } else if (sort === 'low-to-high') {
          q = query(q, orderBy("price", "asc"));
      } else {
          q = query(q, orderBy("createdAt", "desc"));
      }
  }

  q = query(q, limit(100));
  
  const querySnapshot = await getDocs(q);
  
  let products = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });
  console.log(`[HomePageService] Fetched ${products.length} products from backend matching primary filter.`);

  
  
  if (products.length === 0) return [];
  let count = 1;
  console.log(`79: ===> ${products.length} products`)
  const filteredProducts = products.filter(product => {
    try{
       console.log(`83: ===> ${product.id}`)

   
    const checkArrayFilter = (productArray, filterArray) => {
         
      if (!filterArray || filterArray.length === 0) return true;
      
      
     
      if (!productArray || !Array.isArray(productArray) || productArray.length === 0) {
        return false;
      }
      const lowercasedProductArray = productArray.map(item => String(item).toLowerCase());
      
      
      const lowercasedFilterArray = filterArray.map(item => String(item).toLowerCase());
      
      console.log(lowercasedProductArray);
      console.log(lowercasedFilterArray);
      console.log(lowercasedFilterArray.some(filterItem => lowercasedProductArray.includes(filterItem)))
      return lowercasedFilterArray.some(filterItem => lowercasedProductArray.includes(filterItem));
    };

   
    const checkStringFilter = (productString, filterArray) => {
        if (!filterArray || filterArray.length === 0) return true;
        if (!productString) return false;

        const lowercasedFilterArray = filterArray.map(item => String(item).toLowerCase());
        return lowercasedFilterArray.includes(String(productString).toLowerCase());
    };

   

    
    const passedCategory = categoryWasFilteredOnBackend ? true : checkArrayFilter(product.category, filters.category);
    const passedGender = genderWasFilteredOnBackend ? true : checkStringFilter(product.gender, filters.gender);
    const passedSize = checkArrayFilter(product.sizes, filters.size);
    const passedStyle = checkArrayFilter(product.styles, filters.style);
    const passedColor = checkArrayFilter(product.colors, filters.color);
    const passedMaterial = checkArrayFilter(product.material, filters.material);
    const passedTexture = checkArrayFilter(product.texture, filters.texture);
    const passedSeason = checkArrayFilter(product.season, filters.season);
      count++;
    return passedCategory && passedGender && 
           passedSize && passedStyle && 
           passedColor && passedMaterial && 
           passedTexture && passedSeason;
    }catch (e) {
        console.error(`Error filtering product ID: ${product.id}. Check its data in Firestore.`, e);
        return false; 
    }
    
  }

);

  console.log(`[count=> ${count}}`);
  console.log(`[HomePageService] Returning ${filteredProducts.length} products after all client-side filters.`);
  return filteredProducts;
}

function getProductsForBusiness(businessId) {
    console.warn("[HomePageService] getProductsForBusiness is deprecated. Use getFilteredProducts instead.");
    return getFilteredProducts({ businessId: businessId });
}

export const HomePageService = {
  getProductsForBusiness,
  getFilteredProducts
};