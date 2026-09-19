import { useRef, useState } from "react";
import { Sparkles, Send, Loader2, Link2, Upload, ArrowRight, Plus } from "lucide-react";
import PlaceDetailCard from "../components/PlaceDetailCard.jsx";
import ReelDetail from "../components/ReelDetail.jsx";
import { askReelToReal, ingestFile, ingestUrl } from "../lib/api.js";

export default function ExploreAI({
  reels = [],
  onCraft,
  crafting = false,
  onIngested,
  onToggleSave,
  onHistory,
}) {
  // Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello Alex! I am your ReelToReal AI assistant. I have indexed all your saved reels. Ask me anything about your saved food spots, waterfalls, shopping destinations, or prices!",
    },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatResult, setChatResult] = useState(null);

  // Ingestion Drawer / Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [openReel, setOpenReel] = useState(null);

  // Handle conversational chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const val = chatQuery.trim();
    if (!val || chatBusy) return;

    const newMessages = [...chatMessages, { role: "user", content: val }];
    setChatMessages(newMessages);
    setChatQuery("");
    setChatBusy(true);

    try {
      const historyPayload = newMessages.slice(-8);
      const res = await askReelToReal(val, historyPayload);
      setChatResult(res);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer || "Here is what I found in your reels." },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Could not retrieve answer: ${err.message}` },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div className="relative space-y-8 pb-16">
      {/* Executive Dark Gradient Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900 p-6 sm:p-10 text-white shadow-xl border border-indigo-900/40">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-52 w-52 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md mb-3 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>AI Travel Intelligence & Grounded Reel Chat</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Explore AI Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Converse with your saved reels via AI — ask about foods, waterfalls, shopping spots, or prices, grounded entirely in what you've saved.
            </p>
          </div>

          {/* Quick Action: Ingest a New Reel */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              Add Reel
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ASK YOUR SAVED REELS
         ========================================================================= */}
      {(
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Ask Your Saved Reels
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ground answers solely in your saved video reels. Search for specific foods, secret spots, prices, or recommendations.
              </p>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Try Asking:
              </span>
              {[
                "Where can I get the best 10rs parotta?",
                "Which dam or waterfall in Erode has good water flow?",
                "Recommend a budget friendly shopping spot near Erode bus stand",
                "Where to have authentic mutton biryani in Erode?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setChatQuery(suggestion)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Conversation Thread */}
            <div className="min-h-[280px] max-h-[460px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#2563eb] text-white rounded-br-xs shadow-xs"
                        : "bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    <p className="font-semibold text-xs mb-1 opacity-75">
                      {msg.role === "user" ? "You" : "ReelToReal AI"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {chatBusy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/70 p-4 text-sm text-slate-500 shadow-2xs">
                    <Loader2 className="h-4 w-4 animate-spin text-[#2563eb]" />
                    <span>Searching through your saved reels...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Box */}
            <form onSubmit={handleChatSubmit} className="mt-4 flex gap-3">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask about foods, waterfalls, shops, prices..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                disabled={chatBusy}
              />
              <button
                type="submit"
                disabled={chatBusy || !chatQuery.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>Ask AI</span>
              </button>
            </form>

            {/* Grounded Place Detail Cards: Image + Map + Key Details + Attractions + Description */}
            {chatResult?.items && chatResult.items.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2563eb]" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Discovered Places & Shop Details ({chatResult.items.length} spots)
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Sourced directly from your saved reels
                  </span>
                </div>

                {chatResult.items.map((item, idx) => {
                  const matchedReel = reels.find((r) => r.video_id === item.reel_id);
                  const cardItem = { ...item, thumbnail_url: item.thumbnail_url || matchedReel?.thumbnail_url };

                  return (
                    <PlaceDetailCard
                      key={idx}
                      item={cardItem}
                      headerRight={
                        matchedReel && (
                          <button
                            type="button"
                            onClick={() => setOpenReel(matchedReel)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1 text-xs font-semibold transition-colors"
                          >
                            <span>View Reel</span>
                          </button>
                        )
                      }
                      footer={
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                          <p className="text-xs text-slate-700 leading-snug">
                            Would you like me to create a travel plan for{" "}
                            <span className="font-semibold">{item.name}</span> based on this reel?
                          </p>
                          <button
                            type="button"
                            disabled={crafting}
                            onClick={() =>
                              onCraft?.(`Plan my trip to visit ${item.name} in ${item.city || "Erode"}`)
                            }
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            <span>Plan This Trip</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD REEL MODAL / DRAWER
         ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>
            <AddReel
              onIngested={(r) => {
                onIngested?.(r);
                setShowAddModal(false);
              }}
            />
          </div>
        </div>
      )}

      <ReelDetail reel={openReel} onClose={() => setOpenReel(null)} />
    </div>
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

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Ingest New Reel</h3>
        <p className="mt-1 text-sm text-slate-500">
          Paste a link from Instagram, YouTube Shorts, or TikTok to extract keyframes, transcript, and OCR places.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="reel-url-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Video Web URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="reel-url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-[#2563eb] focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={busy || !url.trim()}
              onClick={() => run(() => ingestUrl(url.trim()))}
              className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Processing..." : "Ingest"}
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center border-t border-slate-100 pt-4">
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or Direct Video Upload
          </span>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Upload className="h-4 w-4 text-slate-500" />
          <span>Upload video file (MP4 / MOV)</span>
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

      {result && (
        <div
          className={`rounded-xl p-3 text-xs ${
            result.status === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {result.status === "success" ? (
            <p className="font-semibold">Successfully processed {result.place || result.video_id}</p>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
