import { ChevronRight } from "lucide-react";

export default function InspirationList({ prompts = [], onPick, onHistory }) {
  return (
    <aside>
      <h2 className="text-lg font-bold text-ink-900">As inspiration</h2>
      <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {prompts.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onPick?.(prompt)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] text-ink-700 hover:bg-brand-50"
            >
              {prompt}
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-500" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onHistory}
        className="mt-3 text-sm font-medium text-brand-600 hover:underline"
      >
        AI planning history
      </button>
    </aside>
  );
}
