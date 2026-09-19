import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapPin, ExternalLink } from "lucide-react";

// Single-marker OpenStreetMap view for one place (no route / driving stats HUD).
export default function PlaceLocationMap({ lat, lng, name, className = "h-64" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || lat == null || lng == null) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    const placeIcon = L.divIcon({
      className: "custom-place-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 28px; height: 28px; border-radius: 50% 50% 50% 0; background: #e11d48; transform: rotate(-45deg); border: 3px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    L.marker([lat, lng], { icon: placeIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 2px;"><p style="font-weight:700; color:#0f172a; font-size:13px; margin:0;">${name || "Location"}</p></div>`
      )
      .openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name]);

  if (lat == null || lng == null) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-400">
        <MapPin className="h-6 w-6" />
        <p className="text-xs font-medium">Location unavailable for this spot</p>
      </div>
    );
  }

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div ref={mapContainerRef} className={`w-full z-0 ${className}`} />
      <a
        href={gmapsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/70 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#2563eb] shadow-md backdrop-blur-md transition-colors hover:bg-white"
      >
        <span>View on Google Maps</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
