import mapboxgl from "mapbox-gl";

const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY;
mapboxgl.accessToken = MAPBOX_KEY;

// Search-as-you-type: returns multiple candidate matches for a partial
// address/landmark query, so the user can pick the right one from a
// dropdown rather than trusting a single best guess. This is the
// primary way both customers and vendors find a location — they
// should never need to know or enter coordinates themselves.
export const searchAddress = async (query) => {
  if (!query || query.trim().length < 3) return [];
  const encoded = encodeURIComponent(query.trim());
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_KEY}&country=NG&limit=5&types=address,poi,place,neighborhood`
  );
  const data = await res.json();
  return (data.features || []).map((f) => ({
    id: f.id,
    place_name: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
  }));
};

// Reverse geocoding: given coordinates (e.g. after the user drags the
// pin to fine-tune their exact spot), look up a human-readable address
// to display back to them — so they're always looking at a real
// address/landmark, never raw numbers.
export const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_KEY}&country=NG&limit=1`
  );
  const data = await res.json();
  return data.features?.[0]?.place_name || null;
};

// Convert a single address string → { lat, lng } using Mapbox
// Geocoding API. Kept for any existing callers; searchAddress above is
// preferred for anything user-facing since it offers a real choice
// instead of guessing the first result.
export const geocodeAddress = async (address) => {
  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_KEY}&country=NG&limit=1`
  );
  const data = await res.json();
  const [lng, lat] = data.features?.[0]?.center || [];
  return lat && lng ? { lat, lng } : null;
};

// Render a simple map with a draggable marker for pin drop
// Returns { map, cleanup, getCoords }
export const createPinDropMap = (containerId, initialCoords = { lat: 7.1907, lng: 8.1226 }) => {
  const map = new mapboxgl.Map({
    container: containerId,
    style: "mapbox://styles/mapbox/dark-v11",
    center: [initialCoords.lng, initialCoords.lat],
    zoom: 13,
  });

  const marker = new mapboxgl.Marker({ color: "#1a2596", draggable: true })
    .setLngLat([initialCoords.lng, initialCoords.lat])
    .addTo(map);

  map.addControl(new mapboxgl.NavigationControl(), "top-right");
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserHeading: false,
    }),
    "top-right"
  );

  const getCoords = () => {
    const { lat, lng } = marker.getLngLat();
    return { lat, lng };
  };

  const cleanup = () => map.remove();

  return { map, marker, getCoords, cleanup };
};

// Render a rider tracking map (non-interactive, updates marker position)
export const createTrackingMap = (containerId, coords) => {
  const map = new mapboxgl.Map({
    container: containerId,
    style: "mapbox://styles/mapbox/dark-v11",
    center: [coords.lng, coords.lat],
    zoom: 14,
    interactive: false,
  });

  const marker = new mapboxgl.Marker({ color: "#1a2596" })
    .setLngLat([coords.lng, coords.lat])
    .addTo(map);

  const updatePosition = ({ lat, lng }) => {
    marker.setLngLat([lng, lat]);
    map.easeTo({ center: [lng, lat], duration: 800 });
  };

  return { map, updatePosition, cleanup: () => map.remove() };
};

export default mapboxgl;
