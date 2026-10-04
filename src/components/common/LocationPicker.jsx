import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin } from "lucide-react";
import { createPinDropMap, searchAddress, reverseGeocode } from "@/services/mapbox";
import Input from "./Input";

/**
 * LocationPicker
 *
 * The one place location-picking logic lives, used by both customer
 * checkout and vendor onboarding/settings. The user only ever sees
 * and interacts with addresses, search results, and a map pin —
 * never raw coordinates. Those are captured automatically in the
 * background and handed to the parent via onChange.
 *
 * Flow: type a partial address/landmark → pick from real suggestions
 * → map recenters and drops a pin there → drag to fine-tune exact
 * spot → address text auto-updates to match (reverse geocoded) →
 * onChange({ address, lat, lng }) fires on every confirmed change.
 *
 * Props:
 *   initialAddress, initialLat, initialLng — pre-fill for editing an
 *     already-set location (e.g. vendor updating their store location)
 *   onChange({ address, lat, lng }) — fires whenever the confirmed
 *     location changes (suggestion picked, or pin dragged)
 *   mapId — must be unique per instance if more than one is ever
 *     rendered on the same page at once
 */
export default function LocationPicker({
  initialAddress = "",
  initialLat = null,
  initialLng = null,
  onChange,
  mapId = "location-picker-map",
}) {
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [coords, setCoords] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const debounceRef = useRef(null);

  const emitChange = useCallback(
    (address, lat, lng) => {
      onChange?.({ address, lat, lng });
    },
    [onChange]
  );

  // Debounced search-as-you-type
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(query);
      setSuggestions(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Initialize map once we have a starting point worth showing
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const start = coords || { lat: 7.1907, lng: 8.1226 }; // Otukpo area default
    const { map, marker, getCoords, cleanup } = createPinDropMap(mapId, start);
    mapInstance.current = { map, marker, cleanup };

    marker.on("dragend", async () => {
      const c = getCoords();
      setCoords(c);
      setResolvingAddress(true);
      const address = await reverseGeocode(c.lat, c.lng);
      setResolvingAddress(false);
      if (address) setQuery(address);
      emitChange(address || query, c.lat, c.lng);
    });

    return () => {
      cleanup();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSuggestion = (s) => {
    setQuery(s.place_name);
    setCoords({ lat: s.lat, lng: s.lng });
    setSuggestions([]);
    setShowSuggestions(false);

    if (mapInstance.current) {
      mapInstance.current.map.flyTo({ center: [s.lng, s.lat], zoom: 15 });
      mapInstance.current.marker.setLngLat([s.lng, s.lat]);
    }

    emitChange(s.place_name, s.lat, s.lng);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          label="Search for your address or a nearby landmark"
          placeholder="e.g. Otukpo Central Market, or 5 Ogiri Street"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          helper={resolvingAddress ? "Looking up address..." : undefined}
        />
        {showSuggestions && (searching || suggestions.length > 0) && (
          <div className="absolute z-20 mt-1 w-full bg-surface-raised border border-surface-border rounded-xl overflow-hidden shadow-lg">
            {searching && (
              <div className="px-4 py-3 text-slate-muted text-sm">Searching...</div>
            )}
            {!searching &&
              suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 text-sm text-ink hover:bg-surface border-b border-surface-border last:border-0 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />{s.place_name}
                </button>
              ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-slate-soft text-sm font-medium mb-2">
          Confirm the exact spot — drag the pin if it's not quite right
        </p>
        <div
          id={mapId}
          ref={mapRef}
          className="w-full h-56 rounded-2xl overflow-hidden border border-surface-border"
        />
        {coords && (
          <p className="text-teal text-xs mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location has been set</p>
        )}
        {!coords && (
          <p className="text-slate-muted text-xs mt-1">
            Search above or drag the pin to set your exact location
          </p>
        )}
      </div>
    </div>
  );
}
