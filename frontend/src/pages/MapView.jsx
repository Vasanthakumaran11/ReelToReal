import { useMemo, useState } from "react";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import MapCanvas from "../components/MapCanvas.jsx";
import { categoryGradient } from "../lib/format.js";

const TONE_DOT = {
  start: "text-emerald-600",
  mid: "text-amber-500",
  end: "text-rose-600",
};

export default function MapView({ locations, layers, reels, onOpenReel }) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("All reels");
  const [active, setActive] = useState(null);
  const [layerState, setLayerState] = useState(
    Object.fromEntries(layers.map((l) => [l.id, l.on]))
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) =>
      `${l.name} ${l.label}`.toLowerCase().includes(q)
    );
  }, [locations, query]);

  const activeReel = active ? reels.find((r) => r.video_id === active.reel_id) : null;

  return (
    <section className="relative h-[calc(100vh-150px)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200">
      <MapCanvas
        locations={layerState.activity_zones ? visible : []}
        route={layerState.routes}
        areas={layerState.areas}
        labels={layerState.labels}
        activeId={active?.id}
        onSelect={setActive}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="pointer-events-auto flex flex-wrap items-start gap-3">
          <div className="w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <h2 className="text-sm font-bold text-ink-900">Map controls</h2>
            <h3 className="mt-3 text-[13px] font-semibold text-ink-900">Saved locations</h3>
            <ul className="mt-2 space-y-1.5">
              {visible.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    onClick={() => setActive(loc)}
                    className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-slate-50 ${
                      active?.id === loc.id ? "bg-brand-50 text-brand-700" : "text-ink-700"
                    }`}
                  >
                    <MapPin className={`h-4 w-4 shrink-0 ${TONE_DOT[loc.tone] || ""}`} />
                    {loc.label}
                  </button>
                </li>
              ))}
              {visible.length === 0 && (
                <li className="px-1.5 py-1 text-[13px] text-ink-500">
                  No saved location matches that search.
                </li>
              )}
            </ul>
          </div>

          <div className="flex min-w-[260px] flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search locations"
                aria-label="Search locations"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm shadow-lg placeholder:text-ink-500 focus:border-brand-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                aria-label="Reel collection"
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm shadow-lg focus:border-brand-500"
              >
                <option>All reels</option>
                <option>Beach reels</option>
                <option>Food reels</option>
                <option>Hike reels</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            </div>
          </div>
        </div>

        <div className="pointer-events-auto w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <h2 className="text-sm font-bold text-ink-900">Map layers</h2>
          <ul className="mt-2.5 space-y-2">
            {layers.map((layer) => (
              <li key={layer.id}>
                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-700">
                  <input
                    type="checkbox"
                    checked={!!layerState[layer.id]}
                    onChange={() =>
                      setLayerState((s) => ({ ...s, [layer.id]: !s[layer.id] }))
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                  />
                  {layer.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {active && (
        <div className="absolute bottom-4 right-4 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-ink-900">{active.name}</p>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="rounded p-0.5 text-ink-500 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div
            className={`mt-2 h-20 rounded-lg bg-gradient-to-br ${categoryGradient(
              activeReel?.category
            )}`}
            aria-hidden="true"
          />
          <p className="mt-2 text-xs text-ink-500">{active.label}</p>
          {activeReel && (
            <button
              type="button"
              onClick={() => onOpenReel?.(activeReel)}
              className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Open reel
            </button>
          )}
        </div>
      )}
    </section>
  );
}
