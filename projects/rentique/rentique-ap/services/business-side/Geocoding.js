/*
  @Made By: Anmol Singh
 */
import { GeoPoint } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


import { GOOGLE_MAPS_API_KEY } from './firebase-config.js';

export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return null;
  }
  
  if (!GOOGLE_MAPS_API_KEY) {
      console.error("[Geocoding] FATAL: Google Maps API Key is not configured in services/api-keys.js");
      return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return new GeoPoint(location.lat, location.lng);
    } else {
      console.warn(`[Geocoding] Could not geocode address: "${address}". Status: ${data.status}`);
      return new GeoPoint(43.6532, -79.3832);
    }
  } catch (error) {
    console.error("[Geocoding] API call failed:", error);
    return new GeoPoint(43.6532, -79.3832);
  }
}