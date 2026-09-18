import { useMemo, useRef, useState } from "react";
import { Link2, Loader2, Upload } from "lucide-react";
import PlanComposer from "../components/PlanComposer.jsx";
import InspirationList from "../components/InspirationList.jsx";
import ReelCard from "../components/ReelCard.jsx";
import ReelDetail from "../components/ReelDetail.jsx";
import MapView from "./MapView.jsx";
import { ingestFile, ingestUrl } from "../lib/api.js";
import { inspirationPrompts, mapLayers } from "../data/plans.js";

const VIEWS = [
  { id: "ask", label: "Ask" },
  { id: "map", label: "Map" },
  { id: "add", label: "Add a reel" },
];

export default function ExploreAI({ reels = [], onCraft, crafting, onIngested, onToggleSave, onHistory }) {
  const [view, setView] = useState("ask");
  const [question, setQuestion] = useState("");
  const [openReel, setOpenReel] = useState(null);

  const mapLocations = useMemo(() => {
    return (reels || [])
      .filter((r) => r.location?.latitude && r.location?.longitude)
      .map((r, idx) => ({
        id: `loc_${r.video_id}`,
        name: r.place || r.city || "Saved Spot",
        label: `${r.place || r.city || "Location"} (${r.category || "Spot"})`,
        lat: r.location.latitude,
        lng: r.location.longitude,
        tone: idx === 0 ? "start" : idx % 2 === 0 ? "mid" : "end",
        reel_id: r.video_id,
      }));
  }, [reels]);

  return (
    <>
      <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              view === v.id ? "bg-brand-600 text-white" : "text-ink-700 hover:bg-slate-50"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "ask" && (
        <>
          <PlanComposer
            onCraft={onCraft}
            busy={crafting}
            value={question}
            onValue={setQuestion}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
            <InspirationList
              prompts={inspirationPrompts}
              onPick={setQuestion}
              onHistory={onHistory}
            />

            <section>
              <h2 className="text-lg font-bold text-ink-900">Featured reel insights</h2>
              {reels.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-ink-500">
                  <p className="font-medium text-ink-700">No reels added yet</p>
                  <p className="mt-1 text-xs">
                    Switch to the &ldquo;Add a reel&rdquo; tab to paste a link or upload a video.
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {reels.slice(0, 6).map((reel) => (
                    <ReelCard
                      key={reel.video_id}
                      reel={reel}
                      onToggleSave={onToggleSave}
                      onOpen={setOpenReel}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
          <ReelDetail reel={openReel} onClose={() => setOpenReel(null)} />
        </>
      )}

      {view === "map" && (
        <>
          <MapView
            locations={mapLocations}
            layers={mapLayers}
            reels={reels}
            onOpenReel={setOpenReel}
          />
          <ReelDetail reel={openReel} onClose={() => setOpenReel(null)} />
        </>
      )}

      {view === "add" && <AddReel onIngested={onIngested} />}
    </>
  );
}

function AddReel({ onIngested }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);

  async function run(fn) {
    setBusy(true);
    setResult(null);
    try {
      const record = await fn();
      setResult(record);
      if (record.status === "success") onIngested?.(record);
    } catch (err) {
      setResult({ status: "failed", error: err.message });
    } finally {
      setBusy(false);
    }
  }

  const needsUpload = result?.fallback_action === "request_direct_upload";

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900">Add a reel</h2>
        <p className="mt-1 text-sm text-ink-500">
          Paste a link from Instagram, YouTube Shorts, or TikTok. If the link is behind a
          login, upload the video file instead.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <label htmlFor="reel-url" className="text-sm font-medium text-ink-900">
          Reel link
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              id="reel-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm placeholder:text-ink-500 focus:border-brand-500"
            />
          </div>
          <button
            type="button"
            disabled={busy || !url.trim()}
            onClick={() => run(() => ingestUrl(url.trim()))}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Processing" : "Save reel"}
          </button>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Upload a video file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) run(() => ingestFile(file));
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            result.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
          role="status"
        >
          {result.status === "success" ? (
            <>
              <p className="font-semibold">Saved {result.place || result.video_id}</p>
              {result.summary && <p className="mt-1">{result.summary}</p>}
            </>
          ) : (
            <>
              <p className="font-semibold">That reel didn't go through</p>
              <p className="mt-1 break-words font-mono text-xs">{result.error}</p>
              {needsUpload && (
                <p className="mt-2">
                  The site blocked the download. Upload the video file above to continue.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
