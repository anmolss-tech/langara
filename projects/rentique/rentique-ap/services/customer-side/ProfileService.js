import { auth, firestore as db, storage } from "../business-side/firebase-init.js";
import { doc, getDoc, updateDoc, arrayRemove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"
import { getProductById } from "./ProductService.js";

export async function getUserProfile() {
  const user = auth.currentUser
  if (!user) {
    console.warn("No user logged in.")
    return null
  }
  try {
    const profileRef = doc(db, "profiles", user.uid)
    const docSnap = await getDoc(profileRef)
    return docSnap.exists() ? { uid: user.uid, ...docSnap.data() } : null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfile(data) {
  const user = auth.currentUser
  if (!user) throw new Error("User not authenticated.")
  const profileRef = doc(db, "profiles", user.uid)
  await updateDoc(profileRef, data)
}


export async function uploadProfilePhoto(file) {
  const user = auth.currentUser
  if (!user) throw new Error("User not authenticated.")
  const filePath = `profile-photos/${user.uid}/${file.name}`
  const storageRef = ref(storage, filePath)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}


export async function getLikedProducts(productIds) {
  if (!productIds || productIds.length === 0) {
    return []
  }
  const productPromises = productIds.map((id) => getProductById(id))
  const products = await Promise.all(productPromises)
  return products.filter((p) => p !== null)
}

export async function removeLikedProduct(productId) {
  const user = auth.currentUser
  if (!user) throw new Error("User not authenticated.")
  const profileRef = doc(db, "profiles", user.uid)
  await updateDoc(profileRef, {
    likedProductIDs: arrayRemove(productId),
  })
}

export async function updateUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser
  if (!user) throw new Error("User not authenticated.")
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export async function deleteUserAccount(currentPassword) {
  const user = auth.currentUser
  if (!user) throw new Error("User not authenticated.")

  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)

  const profileRef = doc(db, "profiles", user.uid)
  await updateDoc(profileRef, { deleted: true, deletedAt: new Date() })

  await deleteUser(user)
}

export const profileService = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  getLikedProducts,
  removeLikedProduct,
  updateUserPassword,
  deleteUserAccount,
}
