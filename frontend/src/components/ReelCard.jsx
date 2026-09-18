import { Bookmark, MapPin } from "lucide-react";
import { categoryGradient, categoryLabel, formatDuration } from "../lib/format.js";

export default function ReelCard({ reel, onToggleSave, onOpen }) {
  const { thumbnail_url, category, place, city, tags = [], duration_seconds, saved } = reel;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-hover">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen?.(reel)}
          className="block w-full text-left"
          aria-label={`Open ${place}`}
        >
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt=""
              className="h-36 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`h-36 w-full bg-gradient-to-br ${categoryGradient(category)}`}
              aria-hidden="true"
            />
          )}
        </button>

        {duration_seconds ? (
          <span className="absolute bottom-2 left-2 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(duration_seconds)}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => onToggleSave?.(reel.video_id)}
          aria-pressed={!!saved}
          aria-label={saved ? "Remove from saved" : "Save reel"}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-ink-700 hover:bg-white"
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-brand-600 text-brand-600" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <span className="w-fit rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium capitalize text-brand-700">
          {categoryLabel(category)}
        </span>

        <h3 className="text-[15px] font-semibold leading-snug text-ink-900">
          <button type="button" onClick={() => onOpen?.(reel)} className="text-left hover:underline">
            {place}
          </button>
        </h3>

        {city && (
          <p className="flex items-center gap-1 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5" />
            {city}
          </p>
        )}

        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {tags.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-ink-700"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
