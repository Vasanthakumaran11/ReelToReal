import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { Navigation, Clock, MapPin, Compass, LocateFixed, Car, ArrowRight } from "lucide-react";

// Haversine distance in kilometers between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format duration from minutes
function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hrs`;
  return `${h} hrs ${m} mins`;
}

export default function OpenStreetMap({
  origin = { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  destinations = [],
  className = "h-[420px]",
  onSelectStop,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLoc, setUserLoc] = useState(origin);
  const [locating, setLocating] = useState(false);

  // Calculate distance and driving timing from user's location to destinations
  const routeStats = useMemo(() => {
    if (!destinations || destinations.length === 0) {
      return { totalKm: 0, driveTimeText: "0 mins", directKm: 0 };
    }

    const firstDest = destinations[0];
    const directKm = haversineDistance(userLoc.lat, userLoc.lng, firstDest.lat, firstDest.lng);

    // Road factor approximation (~1.22x direct aerial distance for highways in South India)
    let totalRoadKm = Math.round(directKm * 1.22);

    // Add intermediate stop distances
    for (let i = 0; i < destinations.length - 1; i++) {
      const legKm = haversineDistance(
        destinations[i].lat,
        destinations[i].lng,
        destinations[i + 1].lat,
        destinations[i + 1].lng
      );
      totalRoadKm += Math.round(legKm * 1.25);
    }

    // Average driving speed: 60 km/h + 15 min buffer
    const driveMinutes = Math.round((totalRoadKm / 60) * 60 + 15);

    return {
      totalKm: totalRoadKm,
      driveTimeText: formatMinutes(driveMinutes),
      directKm: Math.round(directKm),
    };
  }, [userLoc, destinations]);

  // Handle GPS location request
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          name: "My Live Location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map with OpenStreetMap tiles
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    // OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    const bounds = L.latLngBounds();

    // 1. Add User Origin Marker
    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <p style="font-weight: 700; color: #1e293b; font-size: 13px; margin: 0;">📍 Starting Location</p>
        <p style="color: #64748b; font-size: 12px; margin: 2px 0 0 0;">${userLoc.name}</p>
      </div>
    `);
    bounds.extend([userLoc.lat, userLoc.lng]);

    // 2. Add Destination Markers
    const routePoints = [[userLoc.lat, userLoc.lng]];

    destinations.forEach((dest, idx) => {
      routePoints.push([dest.lat, dest.lng]);
      bounds.extend([dest.lat, dest.lng]);

      const isEnd = idx === destinations.length - 1;
      const markerColor = isEnd ? "#e11d48" : "#059669";

      const destIcon = L.divIcon({
        className: "custom-dest-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${markerColor}; color: #ffffff; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.25);">
              ${idx + 1}
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${markerColor};"></div>
          </div>
        `,
        iconSize: [26, 32],
        iconAnchor: [13, 32],
      });

      const destMarker = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map);

      // Popup with place info and thumbnail
      const thumbHtml = dest.thumbnail_url
        ? `<img src="${dest.thumbnail_url}" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />`
        : "";

      destMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px; padding: 2px;">
          ${thumbHtml}
          <p style="font-weight: 700; color: #0f172a; font-size: 13px; margin: 0;">Stop ${idx + 1}: ${dest.name || dest.place}</p>
          <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0;">${dest.city || "Destination"}</p>
        </div>
      `);

      destMarker.on("click", () => {
        onSelectStop?.(dest);
      });
    });

    // 3. Draw Route Polyline from User Location to All Stops
    if (routePoints.length > 1) {
      L.polyline(routePoints, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8",
        lineJoin: "round",
      }).addTo(map);
    }

    // 4. Fit map to include both user location and destinations with generous padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLoc, destinations, onSelectStop]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Real-time OpenStreetMap Container */}
      <div ref={mapContainerRef} className={`w-full z-0 ${className}`} />

      {/* Floating Route Intelligence HUD */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-md border border-slate-200/70 text-xs sm:text-sm">
        {/* Origin */}
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <MapPin className="h-4 w-4 text-[#2563eb] shrink-0" />
          <span className="font-semibold text-slate-900">{userLoc.name}</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">
            {destinations[0]?.city || destinations[0]?.name || "Destination"}
          </span>
        </div>

        {/* Distance Badge */}
        <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563eb]">
          <Navigation className="h-3.5 w-3.5" />
          <span>{routeStats.totalKm} km</span>
        </div>

        {/* Duration Badge */}
        <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <Clock className="h-3.5 w-3.5" />
          <span>{routeStats.driveTimeText} drive</span>
        </div>

        {/* GPS Live Relocate Button */}
        <button
          type="button"
          onClick={requestCurrentLocation}
          disabled={locating}
          title="Use current device GPS location"
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <LocateFixed className={`h-3.5 w-3.5 text-slate-500 ${locating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{locating ? "Locating..." : "Use My GPS"}</span>
        </button>
      </div>

      {/* Attribution & OpenStreetMap Badge */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1.5 rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] text-slate-500 shadow-xs border border-slate-100">
        <Compass className="h-3 w-3 text-slate-400" />
        <span>OpenStreetMap Live Routing</span>
      </div>
    </div>
  );
}
