import { useMemo, useState } from "react";
import ReelCard from "../components/ReelCard.jsx";
import PromoCard from "../components/PromoCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ReelDetail from "../components/ReelDetail.jsx";
import { categoryLabel } from "../lib/format.js";

export default function SavedItems({ reels, loading, onToggleSave, onAddReel }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openReel, setOpenReel] = useState(null);

  const categories = useMemo(() => {
    const seen = [...new Set(reels.map((r) => r.category).filter(Boolean))];
    return [
      { value: "all", label: "All" },
      ...seen.map((c) => ({ value: c, label: categoryLabel(c) })),
    ];
  }, [reels]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reels.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;
      return [r.place, r.city, r.country, r.cuisine, ...(r.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [reels, query, category]);

  return (
    <>
      <section>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-ink-900">Featured reel suggestions</h2>
          <FilterBar
            query={query}
            onQuery={setQuery}
            categories={categories}
            active={category}
            onCategory={setCategory}
          />
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Nothing matches that yet"
              body="Try a different search, or clear the category filter to see everything you've saved."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((reel) => (
              <ReelCard
                key={reel.video_id}
                reel={reel}
                onToggleSave={onToggleSave}
                onOpen={setOpenReel}
              />
            ))}
            <PromoCard onAction={onAddReel} />
          </div>
        )}
      </section>

      <ReelDetail reel={openReel} onClose={() => setOpenReel(null)} />
    </>
  );
}
