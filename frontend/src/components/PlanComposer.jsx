import { useState } from "react";
import { Loader2 } from "lucide-react";

const PLACEHOLDER =
  "Describe a reel's location or activity (e.g., a cafe in Chennai with the best filter coffee, or a hike in Coimbatore).";

export default function PlanComposer({ onCraft, busy, value, onValue }) {
  const [local, setLocal] = useState("");
  const question = value !== undefined ? value : local;
  const setQuestion = onValue || setLocal;

  function submit() {
    const q = question.trim();
    if (!q || busy) return;
    onCraft(q);
    setQuestion("");
  }

  return (
    <section className="rounded-2xl bg-gradient-to-b from-brand-50 to-brand-100 px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[30px]">
          From vision to reality: collaborate and plan
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-700">
          Shape your ideas into a practical plan
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
          <label htmlFor="plan-question" className="sr-only">
            Describe a reel's location or activity
          </label>
          <textarea
            id="plan-question"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder={PLACEHOLDER}
            className="flex-1 resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-[15px] text-ink-900 placeholder:text-ink-500 focus:border-brand-500"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !question.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Crafting" : "Craft my plan"}
          </button>
        </div>
      </div>
    </section>
  );
}
