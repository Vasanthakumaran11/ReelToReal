import { MapPin, Clock, IndianRupee, Compass, Sparkles, ListChecks, Star, FileText } from "lucide-react";
import PlaceLocationMap from "./PlaceLocationMap.jsx";

// Rich place-detail card: frame image + key details + map + attractions + description.
// Reused by the Ask Your Saved Reels chat results and the trip-plan stop breakdown.
export default function PlaceDetailCard({ item, headerRight, footer }) {
  const detailRows = [
    { icon: MapPin, label: "Location", value: item.location_text || item.formatted_address || item.city },
    { icon: Clock, label: "Best Time to Visit", value: item.best_time_to_visit },
    { icon: IndianRupee, label: "Price", value: item.price },
    { icon: Compass, label: "Category", value: item.category },
    { icon: Sparkles, label: "Vibe", value: item.vibe },
  ].filter((row) => row.value);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h5 className="text-base font-bold text-slate-900">{item.name}</h5>
          {item.tagline && <span className="text-xs text-slate-500 line-clamp-1">— {item.tagline}</span>}
        </div>
        {headerRight}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 sm:p-6">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr] gap-4">
            {/* Frame Image */}
            <div className="h-48 sm:h-full min-h-[180px] overflow-hidden rounded-2xl bg-slate-100">
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                  {item.name}
                </div>
              )}
            </div>

            {/* Key Details */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <h6 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ListChecks className="h-3.5 w-3.5" />
                Key Details
              </h6>
              {detailRows.length > 0 ? (
                <dl className="space-y-2.5">
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex items-start gap-2">
                      <row.icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {row.label}
                        </dt>
                        <dd className="text-xs font-medium text-slate-800 line-clamp-2">{row.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-slate-400">No further details captured for this spot yet.</p>
              )}
            </div>
          </div>

          {/* Top Attractions */}
          {item.key_points && item.key_points.length > 0 && (
            <div>
              <h6 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Star className="h-3.5 w-3.5" />
                Top Attractions
              </h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.key_points.map((kp, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{kp.title}</p>
                      {kp.desc && <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{kp.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          {item.detailed_description && (
            <div>
              <h6 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Detailed Description
              </h6>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.detailed_description}</p>
            </div>
          )}

          {/* Note / Practical Tip */}
          {item.note && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {item.note}
            </p>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Location on Map */}
          <div>
            <h6 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              Location on Map
            </h6>
            <PlaceLocationMap lat={item.latitude} lng={item.longitude} name={item.name} className="h-56" />
          </div>

          {/* Quick Facts */}
          {detailRows.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <h6 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Quick Facts</h6>
              <dl className="space-y-2">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                    <dt className="text-slate-500 shrink-0">{row.label}</dt>
                    <dd className="font-semibold text-slate-800 text-right line-clamp-1">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {footer}
        </div>
      </div>
    </article>
  );
}
