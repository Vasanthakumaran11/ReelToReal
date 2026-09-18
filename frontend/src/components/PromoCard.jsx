import { Sparkles } from "lucide-react";

export default function PromoCard({ onAction }) {
  return (
    <aside className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-4 ring-1 ring-brand-200">
      <div>
        <Sparkles className="h-5 w-5 text-brand-600" />
        <p className="mt-3 text-[15px] font-semibold leading-snug text-ink-900">
          Turn your saved reels into real plans
        </p>
        <p className="mt-1.5 text-xs text-ink-700">
          Ask a question above and ReelToReal pulls the places, tips, and timing out of
          what you already saved.
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 w-fit rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700"
      >
        Add a reel
      </button>
    </aside>
  );
}
