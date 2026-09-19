import { useMemo, useRef, useState } from "react";
import {
  Sparkles,
  MessageSquare,
  MapPin,
  Compass,
  Navigation,
  Send,
  Loader2,
  Clock,
  Link2,
  Upload,
  ArrowRight,
  Bookmark,
  Share2,
  CheckCircle2,
  Plus,
  Car,
} from "lucide-react";
import OpenStreetMap from "../components/OpenStreetMap.jsx";
import ReelDetail from "../components/ReelDetail.jsx";
import { askReelToReal, ingestFile, ingestUrl } from "../lib/api.js";

const DEFAULT_TRIP_PRESETS = [
  {
    id: "erode-food",
    title: "Erode Food & Parotta Trail",
    destination: "Erode",
    query: "Plan a food trail in Erode covering 10rs parotta at Banu Mess and Biryani Darbar",
    overview: "Savor the legendary street parottas, unlimited madhi biryani, and Kongu style mutton feast.",
    stops: [
      { name: "Banu Mess", place: "Banu Mess", city: "Erode", lat: 11.341, lng: 77.717, tip: "Crispy parottas and rich spicy gravy", thumbnail_url: "/frames/%E2%9C%85%F0%9F%92%A510rs%20Parotta%20in%20Erode%E2%9D%A4%EF%B8%8F%F0%9F%98%8D%F0%9F%92%A5%F0%9F%93%8CBanu%20Mess.%23powernapvlogs%20.%23erode%20%23erodians%20%23erodian%20%23erodereels/frame_001.jpg" },
      { name: "Biryani Darbar", place: "Biryani Darbar", city: "Erode", lat: 11.343, lng: 77.72, tip: "Unlimited flavorful madhi biryani", thumbnail_url: "/frames/Unlimited%20madhi%20biryani%20at%20erode%20%E2%99%A5%EF%B8%8F%E2%9C%A8%20worth%20budget%20friendly%20food%20spot%20in%20erode%20-Biryani%20dharbarKa/frame_001.jpg" },
      { name: "Sabeer Bhai Biryani", place: "Sabeer Bhai Biryani", city: "Erode", lat: 11.345, lng: 77.724, tip: "Authentic Kongu style mutton feast", thumbnail_url: "/frames/AUTHENTIC%20KONG%20STYLE%20MUTTON%20BIRYANI%20IN%20ERODE%20-%20WORTH%20U%20MAX%20SPOT%20%E2%99%A5%EF%B8%8F-Erode%20foodies%21%20%F0%9F%A4%A9%20Can%20you%20bel/frame_001.jpg" },
    ],
  },
  {
    id: "kodiveri-nature",
    title: "Kodiveri Falls & Scenic Water Escape",
    destination: "Kodiveri & Gobichettipalayam",
    query: "Plan a refreshing nature trip to Kodiveri Falls and Kunderipallam Dam",
    overview: "Escape into green valleys, waterfall dips, dam reservoir views, and fresh riverside fish fry.",
    stops: [
      { name: "Kodiveri Dam & Falls", place: "Kodiveri Dam & Falls", city: "Erode", lat: 11.52, lng: 77.34, tip: "Waterfall bath and fresh fish fry", thumbnail_url: "/frames/Kodiveri%20Falls%20%E2%80%93%20The%20perfect%20escape%20from%20city%20stress%20%F0%9F%8C%8A%F0%9F%8D%83Nature%20-%20Relax%20-%20Memories%20%E2%9C%A8For%20more%20inf/frame_001.jpg" },
      { name: "Kunderipallam Dam", place: "Kunderipallam Dam", city: "Tn Palayam", lat: 11.55, lng: 77.38, tip: "Serene reservoir surrounded by western ghat hills", thumbnail_url: "/frames/%F0%9F%8C%88Hidden%20Place%20Erode%F0%9F%98%85%20%40food_forest_erode%20%F0%9F%93%8DGunderipallam%20Dam%20-%20via%20Gobichettipalayam%2C%20Tn%20Palaya%20%281%29/frame_001.jpg" },
      { name: "Palakarai Bridge", place: "Palakarai Bridge", city: "Nallampatti", lat: 11.38, lng: 77.62, tip: "Drive across the submerged waterway bridge", thumbnail_url: "/frames/%E0%AE%A4%E0%AE%A3%E0%AF%8D%E0%AE%A3%E0%AF%80%E0%AE%B0%E0%AF%81%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AF%81%20%E0%AE%85%E0%AE%9F%E0%AE%BF%E0%AE%AF%E0%AE%BF%E0%AE%B2%E0%AF%8D%20%E0%AE%9A%E0%AF%86%E0%AE%B2%E0%AF%8D%E0%AE%B2%E0%AF%81%E0%AE%AE%E0%AF%8D%20%E0%AE%B5%E0%AE%BE%E0%AE%95%E0%AE%A9%E0%AE%99%E0%AF%8D%E0%AE%95%E0%AE%B3%E0%AF%8D%F0%9F%98%B1%20-%20Palakarai%20Bridge%20in%20Nallampatti%20TamilNadu%20-%20%23shorts%20%23%20%281%29/frame_001.jpg" },
    ],
  },
  {
    id: "salem-feast",
    title: "Salem Non-Veg Feast & Poolampatti Boating",
    destination: "Salem & Poolampatti",
    query: "Plan a day trip to Salem for 300rs Kari Virundhu and Poolampatti boating",
    overview: "Experience traditional banana-leaf non-veg feasts followed by a relaxing boat ride on the Kaveri river.",
    stops: [
      { name: "Namma Veettu Virundhu", place: "Namma Veettu Virundhu", city: "Salem", lat: 11.664, lng: 78.146, tip: "Grand 300rs unlimited non-veg feast", thumbnail_url: "/frames/%F0%9F%92%A5%F0%9F%A4%AF300%E0%AE%B0%E0%AF%82%E0%AE%B5%E0%AE%BE%20%E0%AE%95%E0%AE%B1%E0%AE%BF%20%E0%AE%B5%E0%AE%BF%E0%AE%B0%E0%AF%81%E0%AE%A8%E0%AF%8D%E0%AE%A4%E0%AF%81%20%E0%AE%9A%E0%AE%BE%E0%AE%AA%E0%AF%8D%E0%AE%9F%E0%AF%81%E0%AE%B0%E0%AF%81%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AF%80%E0%AE%99%E0%AF%8D%E0%AE%95%E0%AE%B3%E0%AE%BE..%E2%81%89%EF%B8%8F%F0%9F%92%A2%20%23shorts/frame_001.jpg" },
      { name: "Poolampatti Boat House", place: "Poolampatti Boat House", city: "Poolampatti", lat: 11.51, lng: 77.85, tip: "Kutty Kerala Kaveri river boat round", thumbnail_url: "/frames/Kutty%20Kerala%20family%20trip%F0%9F%98%8DPoolampatti%20-%20kutty%20keralaBoating%20Up%20nd%20down%20-%2050%20per%20headRiver%20round%20%20%281%29/frame_001.jpg" },
    ],
  },
];

export default function ExploreAI({
  reels = [],
  onCraft,
  crafting = false,
  onIngested,
  onToggleSave,
  onHistory,
}) {
  // Primary Tabs: "plan" (Trip Planner with OSM) or "chat" (Ask Saved Reels)
  const [activeTab, setActiveTab] = useState("plan");

  // Trip Planner State
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_TRIP_PRESETS[0]);
  const [planQuery, setPlanQuery] = useState("");
  const [activePlan, setActivePlan] = useState(DEFAULT_TRIP_PRESETS[0]);

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

  // Handle plan submission
  const handlePlanSubmit = (e) => {
    e.preventDefault();
    const q = planQuery.trim();
    if (!q || crafting) return;

    // Call global craft handler
    onCraft?.(q);

    // Build matching stops from current reels for the OpenStreetMap view
    const matching = reels
      .filter((r) => r.location?.latitude && r.location?.longitude)
      .slice(0, 4)
      .map((r) => ({
        name: r.place || r.city || "Stop",
        place: r.place,
        city: r.city,
        lat: r.location.latitude,
        lng: r.location.longitude,
        tip: r.tip_summary || r.summary,
        thumbnail_url: r.thumbnail_url,
      }));

    setActivePlan({
      id: `custom_${Date.now()}`,
      title: q.length > 35 ? q.slice(0, 35) + "..." : q,
      destination: matching[0]?.city || "Custom Trip",
      query: q,
      overview: `Custom itinerary generated for: "${q}". Showing live OpenStreetMap route, distance, and driving time from your location.`,
      stops: matching.length > 0 ? matching : DEFAULT_TRIP_PRESETS[0].stops,
    });
    setPlanQuery("");
  };

  // Select a preset trip to immediately visualize OpenStreetMap route & details
  const selectPreset = (preset) => {
    setSelectedPreset(preset);
    setActivePlan(preset);
  };

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
              Plan custom trips with live OpenStreetMap driving distance & timings from your location, or converse with your saved reels via AI.
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

        {/* Dual Priority Mode Switcher */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "plan"
                ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/30"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Plan a Trip (OpenStreetMap Route)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/30"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Ask Your Saved Reels (AI Chat)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: TRIP PLANNER WITH OPENSTREETMAP (Equal First-Class Priority)
         ========================================================================= */}
      {activeTab === "plan" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Plan Composer & Quick Itinerary Chips */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Plan Your Journey
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a curated trip preset or enter your custom vision. Live OpenStreetMap will chart the route, distance, and driving time from your location.
              </p>
            </div>

            {/* Quick Inspiration Presets */}
            <div className="mb-6 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Featured Routes:
              </span>
              {DEFAULT_TRIP_PRESETS.map((p) => {
                const isSelected = selectedPreset.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#2563eb] text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>

            {/* Custom AI Plan Input Form */}
            <form onSubmit={handlePlanSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Compass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={planQuery}
                  onChange={(e) => setPlanQuery(e.target.value)}
                  placeholder="Where would you like to travel? (e.g., Weekend parotta & biryani food trail in Erode)"
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  disabled={crafting}
                />
              </div>
              <button
                type="submit"
                disabled={crafting || !planQuery.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-7 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {crafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {crafting ? "Mapping Plan..." : "Generate Route & Plan"}
              </button>
            </form>
          </div>

          {/* Interactive OpenStreetMap Details Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563eb] uppercase tracking-wider">
                  Live OpenStreetMap Route
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                  {activePlan.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
                  {activePlan.overview}
                </p>
              </div>

              {/* Quick Action Button */}
              <button
                type="button"
                onClick={() => onCraft?.(activePlan.query)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Save Itinerary to Plans
              </button>
            </div>

            {/* REAL OPENSTREETMAP CONTAINER */}
            <OpenStreetMap
              origin={{ name: "Alex's Location (Bangalore)", lat: 12.9716, lng: 77.5946 }}
              destinations={activePlan.stops}
              className="h-[440px]"
            />

            {/* Itinerary Stops Breakdown with Authentic Keyframes */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                Route Stops & Real Keyframe Insights ({activePlan.stops.length} stops)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activePlan.stops.map((stop, index) => (
                  <div
                    key={index}
                    className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {stop.thumbnail_url && (
                      <img
                        src={stop.thumbnail_url}
                        alt={stop.name}
                        className="h-36 w-full object-cover rounded-xl mb-3 shadow-2xs"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2563eb] text-xs font-bold text-white shrink-0">
                        {index + 1}
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm line-clamp-1">
                        {stop.name}
                      </h5>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{stop.city}</span>
                    </p>
                    {stop.tip && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                        {stop.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: ASK YOUR SAVED REELS (Equal First-Class Priority)
         ========================================================================= */}
      {activeTab === "chat" && (
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

            {/* Grounded Citation Cards If Available */}
            {chatResult?.items && chatResult.items.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Reel Citations & Sourced Locations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {chatResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                      {item.city && (
                        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{item.city}</span>
                        </p>
                      )}
                      {item.price && (
                        <span className="inline-block mt-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {item.price}
                        </span>
                      )}
                      {item.note && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
