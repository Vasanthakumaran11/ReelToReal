import { useState } from "react";
import { ArrowRight, MapPin, X, Navigation } from "lucide-react";
import Timeline from "./Timeline.jsx";
import Checklist from "./Checklist.jsx";
import OpenStreetMap from "./OpenStreetMap.jsx";
import PlaceDetailCard from "./PlaceDetailCard.jsx";

export default function PlanCard({ plan, onToggleStep, onTogglePacking }) {
  const [showModal, setShowModal] = useState(false);

  const getCategoryBadge = (category = "Travel") => {
    const cat = category.toLowerCase();
    if (cat.includes("food")) {
      return { bg: "bg-[#ffedd5]", text: "text-[#c2410c]", label: "Food" };
    }
    if (cat.includes("adventure") || cat.includes("nature")) {
      return { bg: "bg-[#dcfce7]", text: "text-[#15803d]", label: "Adventure" };
    }
    if (cat.includes("shop")) {
      return { bg: "bg-[#fce7f3]", text: "text-[#be185d]", label: "Shopping" };
    }
    return { bg: "bg-[#e0e7ff]", text: "text-[#4338ca]", label: "Travel" };
  };

  const badge = getCategoryBadge(plan.category);
  const placesCount = plan.locations?.length || plan.timeline?.length || 3;
  const durationText = plan.duration || "1 day";
  const createdDate = plan.created_date || plan.created_at || "Apr 21, 2025";

  return (
    <>
      {/* Compact Plan Card matching Image 3 */}
      <article
        onClick={() => setShowModal(true)}
        className="group cursor-pointer flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5"
      >
        {/* Authentic Frame Image Thumbnail */}
        <div className="relative overflow-hidden rounded-xl bg-slate-100">
          {plan.thumbnail_url ? (
            <img
              src={plan.thumbnail_url}
              alt={plan.title}
              className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-44 w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
              {plan.title}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col pt-3">
          {/* Category Badge */}
          <div className="mb-2">
            <span
              className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </span>
          </div>

          {/* Plan Title */}
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#2563eb] transition-colors">
            {plan.title}
          </h3>

          {/* Places & Days Info */}
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{placesCount} places</span>
            <span className="text-slate-300">•</span>
            <span>{durationText}</span>
          </p>

          {/* Footer: Date and Arrow Button */}
          <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400">Created on {createdDate}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-[#2563eb] transition-colors group-hover:bg-[#2563eb] group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>

      {/* Expanded Modal for Detailed Itinerary */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-slate-400">Created on {createdDate}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">{plan.title}</h2>
            {plan.overview && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{plan.overview}</p>
            )}

            {/* Timeline */}
            {plan.timeline && plan.timeline.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Itinerary Stops & Timeline
                </h4>
                <Timeline label={plan.timeline_label || "Schedule"} stages={plan.timeline} />
              </div>
            )}

            {/* Places To Visit: rich stop-by-stop breakdown with image, key details & map */}
            {plan.timeline?.some((s) => s.detailed_description || s.key_points?.length) && (
              <div className="mt-8 space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Places To Visit
                </h4>
                {plan.timeline.map((stage, i) => (
                  <div key={i} className="space-y-2">
                    {stage.travel_note && i > 0 && (
                      <div className="flex items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-600">
                        <Navigation className="h-3.5 w-3.5 text-[#2563eb] mt-0.5 shrink-0" />
                        <span>
                          <span className="font-semibold text-slate-700">Pathway: </span>
                          {stage.travel_note}
                        </span>
                      </div>
                    )}
                    <PlaceDetailCard
                      item={{
                        name: stage.label,
                        tagline: stage.tagline,
                        thumbnail_url: stage.thumbnail_url,
                        city: stage.city,
                        location_text: stage.location_text,
                        best_time_to_visit: stage.best_time_to_visit,
                        price: stage.price,
                        category: stage.category,
                        vibe: stage.vibe,
                        key_points: stage.key_points,
                        detailed_description: stage.detailed_description,
                        note: stage.detail,
                        latitude: stage.latitude,
                        longitude: stage.longitude,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Live OpenStreetMap with exact place locations */}
            {plan.locations && plan.locations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Route Map
                </h4>
                <OpenStreetMap
                  origin={{ name: "Your Location (Bangalore)", lat: 12.9716, lng: 77.5946 }}
                  destinations={plan.locations.map((loc) => ({
                    name: loc.name,
                    place: loc.name,
                    city: plan.destination,
                    lat: loc.lat,
                    lng: loc.lng,
                  }))}
                  className="h-64"
                />
              </div>
            )}

            {/* Steps & Packing */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {plan.steps && plan.steps.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <Checklist
                    title="Actionable Steps"
                    items={plan.steps}
                    onToggle={(i) => onToggleStep?.(plan.plan_id, i)}
                  />
                </div>
              )}

              {plan.packing && plan.packing.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <Checklist
                    title="Packing List"
                    items={plan.packing}
                    onToggle={(i) => onTogglePacking?.(plan.plan_id, i)}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
