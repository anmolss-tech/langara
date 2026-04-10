import { firestore } from "../business-side/firebase-init.js";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

export function getAllProducts(callback) {
  const productsRef = collection(firestore, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        console.warn("⚠️ No products found in Firestore.");
        callback([]);
        return;
      }

      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("ProductService: Products loaded successfully.");
      console.log(products);
      callback(products);
    },
    (error) => {
      console.error("ProductService: Error listening to Firestore:", error);
      callback([]);
    }
  );
}

export async function getProductById(productId) {
  try {
    const productRef = doc(firestore, "products", productId);
    const docSnap = await getDoc(productRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`Product with ID ${productId} not found.`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

export const productService = {
  getAllProducts,
  getProductById,
};
