/*
  @Made By: Anmol Singh
 */
import { firestore } from "./firebase-init.js";
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { StorageService } from "./StorageService.js";

async function createNewProduct(formData, imageFiles, measurementFile) {
  console.log("[ProductService] Starting 'createNewProduct' workflow...");
  if (!formData || !imageFiles || imageFiles.length === 0) {
    throw new Error("Form data and at least one image are required.");
  }
  
  const tempProductRef = doc(collection(firestore, "products"));
  const productId = tempProductRef.id;

  const uploadPromises = [
    StorageService.uploadMultipleFiles(imageFiles, `product_images/${productId}`),
    StorageService.uploadFile(measurementFile, `measurement_charts/${productId}`)
  ];

  const [imageURLs, measurementURL] = await Promise.all(uploadPromises);

  const productData = {
    ...formData,
    images: imageURLs,
    createdAt: Timestamp.fromDate(new Date()),
  };
  
  if (measurementURL) {
    productData.measurementTableUrl = measurementURL;
  }
  
  
  await setDoc(tempProductRef, productData);
  console.log("[ProductService] Product successfully created with ID:", productId);
  
  return { id: productId, ...productData };
}

async function getProductById(productId) {
  console.log(`[ProductService] Fetching product with ID: ${productId}`);
  const docRef = doc(firestore, "products", productId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
}

async function updateProduct(productId, updatedData, newImageFiles = [], existingImageUrls = [], imagesToDeleteUrls = [], newMeasurementFile = null) {
  console.log(`[ProductService] Starting complex update for product: ${productId}`);
  const docRef = doc(firestore, "products", productId);

  const uploadImagesPromise = StorageService.uploadMultipleFiles(newImageFiles, `product_images/${productId}`);
  const deleteImagesPromise = Promise.all(imagesToDeleteUrls.map(url => StorageService.deleteFileByUrl(url)));
  
  let measurementUpdatePromise = Promise.resolve(null);

  if (newMeasurementFile) {
    console.log("[ProductService] New measurement file detected. Processing...");
    measurementUpdatePromise = (async () => {
      const currentSnap = await getDoc(docRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      
      if (currentData.measurementTableUrl) {
        console.log("[ProductService] Deleting old measurement chart...");
        await StorageService.deleteFileByUrl(currentData.measurementTableUrl).catch(err => {
          console.warn("Failed to delete old measurement chart (might not exist):", err);
        });
      }

      console.log("[ProductService] Uploading new measurement chart...");
      return await StorageService.uploadFile(newMeasurementFile, `measurement_charts/${productId}`);
    })();
  }

  const [newImageUrls, _, newMeasurementUrl] = await Promise.all([
    uploadImagesPromise,
    deleteImagesPromise,
    measurementUpdatePromise
  ]);

  const finalImageUrls = [...existingImageUrls, ...newImageUrls];

  const dataToUpdate = {
    ...updatedData,
    images: finalImageUrls,
    lastUpdatedAt: Timestamp.fromDate(new Date())
  };

  if (newMeasurementUrl) {
    dataToUpdate.measurementTableUrl = newMeasurementUrl;
  }

  console.log("[ProductService] Final data to write to Firestore:", dataToUpdate);
 
  await updateDoc(docRef, dataToUpdate);
  console.log(`[ProductService] Product ${productId} updated successfully.`);
}

async function deleteProductById(productId) {
    console.log(`[ProductService] Starting full deletion for product ID: ${productId}`);
    const docRef = doc(firestore, "products", productId);
    const imagesFolderPath = `product_images/${productId}`;
    const chartsFolderPath = `measurement_charts/${productId}`;
    await Promise.all([
        deleteDoc(docRef),
        StorageService.deleteFolder(imagesFolderPath),
        StorageService.deleteFolder(chartsFolderPath)
    ]);
    console.log(`[ProductService] Full deletion complete for product ${productId}.`);
}


export async function getProductsForBusiness(businessId) {
    if (!businessId) {
        console.error("[ProductService] Business ID is required to fetch products.");
        throw new Error("Business ID cannot be empty.");
    }

    console.log(`[ProductService] Fetching products for business ID: ${businessId}`);
    
    const productsCollection = collection(firestore, "products");
    const q = query(
        productsCollection, 
        where("businessID", "==", businessId),
        orderBy("createdAt", "desc") 
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log("[ProductService] No products found for this business.");
        return [];
    }

    const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`[ProductService] Found ${products.length} products.`);
    return products;
}

export const ProductService = {
  createNewProduct,
  getProductById,
  updateProduct,
  deleteProductById,
};