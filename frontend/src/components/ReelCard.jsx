import { Bookmark, MapPin } from "lucide-react";
import { categoryGradient, categoryLabel, formatDuration } from "../lib/format.js";

export default function ReelCard({ reel, onToggleSave, onOpen }) {
  const { thumbnail_url, category, place, city, tags = [], duration_seconds, saved } = reel;

  // Fallback duration display if not set in metadata
  const displayDuration = duration_seconds
    ? formatDuration(duration_seconds)
    : "0:58";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="relative overflow-hidden">
        <button
          type="button"
          onClick={() => onOpen?.(reel)}
          className="block w-full text-left"
          aria-label={`Open ${place || "reel"}`}
        >
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={place || "Reel preview"}
              className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={`h-44 w-full bg-gradient-to-br ${categoryGradient(category)}`}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Duration badge bottom-left */}
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[11px] font-semibold text-white tracking-wide">
          {displayDuration}
        </span>

        {/* Bookmark action button top-right */}
        <button
          type="button"
          onClick={() => onToggleSave?.(reel.video_id)}
          aria-pressed={!!saved}
          aria-label={saved ? "Remove from saved" : "Save reel"}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-lg bg-white/95 shadow-sm text-[#2563eb] hover:bg-white hover:scale-110 transition-all"
        >
          <Bookmark className="h-4 w-4 fill-[#2563eb] text-[#2563eb]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Category Pill */}
        <div className="mb-2">
          <span className="inline-block rounded-md bg-[#eff6ff] px-2.5 py-0.5 text-xs font-semibold text-[#2563eb]">
            {categoryLabel(category)}
          </span>
        </div>

        {/* Place Title */}
        <h3 className="text-[15px] font-bold leading-snug text-slate-900 line-clamp-1">
          <button
            type="button"
            onClick={() => onOpen?.(reel)}
            className="text-left hover:text-[#2563eb] transition-colors"
          >
            {place || "Saved Destination"}
          </button>
        </h3>

        {/* City Location */}
        {city && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{city}</span>
          </p>
        )}

        {/* Tags */}
        <ul className="mt-3.5 flex flex-wrap gap-1.5 pt-1">
          {(tags.length > 0 ? tags.slice(0, 3) : ["Erode", "Local", "Spot"]).map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-medium text-slate-600 capitalize"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
