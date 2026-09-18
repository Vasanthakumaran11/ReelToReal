import { useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { categoryGradient, categoryLabel, formatDuration } from "../lib/format.js";

export default function ReelDetail({ reel, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!reel) return null;

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={reel.place}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative h-40 bg-gradient-to-br ${categoryGradient(reel.category)}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/90 hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium capitalize text-brand-700">
              {categoryLabel(reel.category)}
            </span>
            <h2 className="mt-2 text-lg font-bold text-ink-900">{reel.place}</h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5" />
              {[reel.city, reel.country].filter(Boolean).join(", ")}
              {reel.duration_seconds ? ` · ${formatDuration(reel.duration_seconds)}` : ""}
            </p>
          </div>

          {reel.summary && (
            <p className="text-sm leading-relaxed text-ink-700">{reel.summary}</p>
          )}

          {reel.tip_summary && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
              <p className="text-xs font-semibold text-brand-700">Worth knowing</p>
              <p className="mt-1 text-sm text-ink-700">{reel.tip_summary}</p>
            </div>
          )}

          {reel.foods?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-900">On the menu</p>
              <p className="mt-1 text-sm text-ink-700">{reel.foods.join(", ")}</p>
            </div>
          )}

          <ul className="flex flex-wrap gap-1.5">
            {(reel.tags || []).map((t) => (
              <li
                key={t}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-ink-700"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
