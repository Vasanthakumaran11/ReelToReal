import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { askReelToReal } from "../lib/api.js";

export default function AskReelToReal() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await askReelToReal(value, history);
      setResult(response);
      setHistory((items) => [
        ...items,
        { role: "user", content: value },
        { role: "assistant", content: response.answer },
      ].slice(-12));
      setQuery("");
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900">Ask your saved Reels</h2>
        <p className="mt-1 text-sm text-ink-500">Answers use only the videos you have saved.</p>
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Plan my evening with food and travel"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {busy ? "Thinking" : "Ask"}
        </button>
      </form>
      {result && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4" role="status">
          {result.error ? (
            <p className="text-sm text-rose-700">{result.error}</p>
          ) : (
            <>
              <p className="text-sm leading-6 text-ink-800">{result.answer}</p>
              {result.insufficient_info && <p className="mt-2 text-xs text-ink-500">Your saved Reels do not contain enough information for that request yet.</p>}
              {!result.insufficient_info && result.items?.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {result.items.map((item) => {
                    const source = result.sources?.find((entry) => entry.reel_id === item.reel_id);
                    return (
                      <article key={item.reel_id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <h3 className="font-semibold text-ink-900">{item.name}</h3>
                        {item.city && <p className="mt-1 text-xs text-ink-500">{item.city}</p>}
                        {item.price && <p className="mt-1 text-xs text-ink-600">{item.price}</p>}
                        {item.note && <p className="mt-2 text-sm text-ink-700">{item.note}</p>}
                        {source?.source_url && <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">View Reel</a>}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
