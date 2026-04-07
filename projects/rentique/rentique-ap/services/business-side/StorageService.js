/*
  @Made By: Anmol Singh
 */
import { storage } from "./firebase-init.js";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

async function uploadFile(file, path) {
  if (!(file instanceof File)) {
        console.error("StorageService Error: The first argument to uploadFile was not a File object.", file);
        return null; 
    }
    if (typeof path !== 'string' || path === '') {
        console.error("StorageService Error: The second argument to uploadFile was not a valid path string.", path);
        return null; 
    }
  if (!file) return null;
  console.log(`[StorageService] Uploading file '${file.name}' to path '${path}'.`);
  const uniqueName = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `${path}/${uniqueName}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  console.log(`[StorageService] File uploaded successfully. URL: ${downloadURL}`);
  return downloadURL;
}

async function uploadMultipleFiles(files, path) {
  console.log(`[StorageService] Starting bulk upload of ${files.length} files to path '${path}'.`);
  const uploadPromises = files.map(file => uploadFile(file, path));
  return await Promise.all(uploadPromises);
}

async function deleteFileByUrl(url) {
  if (!url) return;
  try {
    console.log(`[StorageService] Deleting file from URL: ${url}`);
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    console.log(`[StorageService] File deleted successfully.`);
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`[StorageService] File not found for deletion (might have been already deleted): ${url}`);
    } else {
      console.error(`[StorageService] Error deleting file: ${url}`, error);
    }
  }
}

async function deleteFolder(path) {
  console.log(`[StorageService] Deleting all files in folder: ${path}`);
  const folderRef = ref(storage, path);

  try {
    const res = await listAll(folderRef);
    const deletePromises = res.items.map((itemRef) => deleteObject(itemRef));
    await Promise.all(deletePromises);
    console.log(`[StorageService] Successfully deleted ${res.items.length} files from ${path}.`);
  } catch (error) {
    console.error(`[StorageService] Error deleting folder contents at ${path}:`, error);
  }
}

export const StorageService = {
  uploadFile,
  uploadMultipleFiles,
  deleteFileByUrl,
  deleteFolder,
};