import { Search } from "lucide-react";

export default function FilterBar({ query, onQuery, categories, active, onCategory }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search saved reels"
          aria-label="Search saved reels"
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-ink-500 focus:border-brand-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onCategory(c.value)}
            aria-pressed={active === c.value}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              active === c.value
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-ink-700 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
