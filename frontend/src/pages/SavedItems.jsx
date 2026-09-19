import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ReelCard from "../components/ReelCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ReelDetail from "../components/ReelDetail.jsx";

const FIXED_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "food_and_drink", label: "Food & Drink" },
  { id: "travel", label: "Travel" },
  { id: "shopping", label: "Shopping" },
  { id: "others", label: "Others" },
];

export default function SavedItems({ reels, loading, onToggleSave, onAddReel }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openReel, setOpenReel] = useState(null);

  // Filter out empty placeholder/test records to only display authentic current data
  const authenticReels = useMemo(() => {
    return reels.filter(
      (r) => r.video_id !== "test_reel" && (r.place || r.thumbnail_url || r.summary)
    );
  }, [reels]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return authenticReels.filter((r) => {
      if (category !== "all") {
        if (category === "others") {
          if (["food_and_drink", "travel", "shopping"].includes(r.category)) return false;
        } else if (r.category !== category) {
          return false;
        }
      }
      if (!q) return true;
      return [r.place, r.city, r.country, r.cuisine, ...(r.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [authenticReels, query, category]);

  return (
    <div className="relative pb-12">
      {/* Top Header Section with Botanical Accent */}
      <div className="relative mb-6 flex flex-col justify-between pt-2 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Saved Reels
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base font-normal">
            All your favorite moments, in one place.
          </p>
        </div>

        {/* Top-Right Hand-Drawn "Good Vibes Only ♡" Botanical Decoration */}
        <div className="absolute right-0 -top-2 select-none pointer-events-none sm:relative sm:top-0 flex items-center gap-2">
          <div className="text-right">
            <span className="block font-serif italic text-sm sm:text-base text-[#b45309] font-medium leading-tight">
              Good Vibes Only ♡
            </span>
          </div>
          <svg
            className="w-12 h-14 sm:w-16 sm:h-18 text-[#22c55e] opacity-85"
            viewBox="0 0 64 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 68C18 50 32 30 52 14"
              stroke="#15803d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M26 50C20 44 22 36 28 36C34 36 34 44 26 50Z"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="1.5"
            />
            <path
              d="M36 38C34 30 42 26 46 28C50 30 46 40 36 38Z"
              fill="#16a34a"
              stroke="#15803d"
              strokeWidth="1.5"
            />
            <path
              d="M45 23C46 16 54 14 57 17C60 20 54 27 45 23Z"
              fill="#4ade80"
              stroke="#15803d"
              strokeWidth="1.5"
            />
            <path
              d="M18 60C14 54 18 48 24 50C28 52 24 62 18 60Z"
              fill="#15803d"
              stroke="#166534"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Search and Category Pill Bar */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Pill Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved reels..."
            className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-xs transition-all focus:border-[#e83d57] focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {FIXED_CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#e83d57] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reels Grid (4 columns) */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/70 shadow-xs" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No reels found"
            body="Try a different search, or clear the category filter to view your saved reels."
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {visible.map((reel) => (
            <ReelCard
              key={reel.video_id}
              reel={reel}
              onToggleSave={onToggleSave}
              onOpen={setOpenReel}
            />
          ))}
        </div>
      )}

      <ReelDetail reel={openReel} onClose={() => setOpenReel(null)} />
    </div>
  );
}
