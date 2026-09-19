import { useMemo, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import PlanCard from "../components/PlanCard.jsx";

export default function Plans({
  plans = [],
  reels = [],
  crafting = false,
  onCraft,
  onStart,
  onToggleStep,
  onTogglePacking,
}) {
  const [prompt, setPrompt] = useState("");

  // Helper to attach authentic keyframe thumbnail to plans using current reels data
  const enrichPlanWithReelFrames = (planList) => {
    return planList.map((plan, index) => {
      if (plan.thumbnail_url) return plan;

      // Find first reel matching this plan's reel_ids
      let matchedReel = null;
      if (plan.reel_ids && plan.reel_ids.length > 0) {
        matchedReel = reels.find(
          (r) => plan.reel_ids.includes(r.video_id) && r.thumbnail_url
        );
      }

      // If no direct match, assign from available reels based on category or index
      if (!matchedReel && reels.length > 0) {
        const validReelsWithThumb = reels.filter((r) => r.thumbnail_url);
        if (validReelsWithThumb.length > 0) {
          matchedReel =
            validReelsWithThumb.find((r) => r.category === plan.category) ||
            validReelsWithThumb[index % validReelsWithThumb.length];
        }
      }

      return {
        ...plan,
        thumbnail_url: matchedReel?.thumbnail_url || null,
      };
    });
  };

  // Default grounded plans built strictly from current reels data
  const defaultPlans = useMemo(() => {
    // Find authentic reels for the plans
    const parottaReel = reels.find((r) => r.place?.includes("Banu") || r.tags?.includes("food")) || reels[0];
    const kodiveriReel = reels.find((r) => r.place?.includes("Kodiveri") || r.category === "travel") || reels[4];
    const shopReel = reels.find((r) => r.place?.includes("Mozzo") || r.category === "shopping") || reels[1];

    return [
      {
        plan_id: "plan_food_trail",
        title: "Erode Food & Parotta Trail",
        category: "Food",
        duration: "1 day",
        created_date: "Apr 21, 2025",
        thumbnail_url: parottaReel?.thumbnail_url || "/frames/%E2%9C%85%F0%9F%92%A510rs%20Parotta%20in%20Erode%E2%9D%A4%EF%B8%8F%F0%9F%98%8D%F0%9F%92%A5%F0%9F%93%8CBanu%20Mess.%23powernapvlogs%20.%23erode%20%23erodians%20%23erodian%20%23erodereels/frame_001.jpg",
        overview: "A culinary journey through Erode's iconic street food spots, crispy parottas, and biryani.",
        timeline: [
          { label: "Banu Mess", detail: "Enjoy hot crisp parottas and spicy gravy", tone: "start" },
          { label: "Biryani Darbar", detail: "Unlimited flavorful madhi biryani lunch", tone: "mid" },
          { label: "Sabeer Bhai Biryani", detail: "Authentic Kongu style mutton dinner", tone: "end" },
        ],
        locations: [
          { name: "Banu Mess", lat: 11.341, lng: 77.717, tone: "start" },
          { name: "Biryani Darbar", lat: 11.343, lng: 77.72, tone: "mid" },
        ],
        steps: [
          { label: "Arrive early at Banu Mess before morning rush", done: false },
          { label: "Carry cash for local food stalls", done: true },
        ],
        packing: [
          { label: "Water bottle", done: false },
          { label: "Wet wipes", done: true },
        ],
      },
      {
        plan_id: "plan_nature_escape",
        title: "Kodiveri & Nature Escape",
        category: "Travel",
        duration: "1 day",
        created_date: "Apr 18, 2025",
        thumbnail_url: kodiveriReel?.thumbnail_url || "/frames/Kodiveri%20Falls%20%E2%80%93%20The%20perfect%20escape%20from%20city%20stress%20%F0%9F%8C%8A%F0%9F%8D%83Nature%20-%20Relax%20-%20Memories%20%E2%9C%A8For%20more%20inf/frame_001.jpg",
        overview: "A rejuvenating escape to scenic waterfalls, scenic dam reservoirs, and lush nature walks.",
        timeline: [
          { label: "Kodiveri Dam & Falls", detail: "Refreshing waterfall bath and scenic walk", tone: "start" },
          { label: "Kunderipallam Dam", detail: "Peaceful reservoir views surrounded by green hills", tone: "mid" },
          { label: "Palakarai Bridge", detail: "Scenic drive across water crossing bridge", tone: "end" },
        ],
        locations: [
          { name: "Kodiveri Falls", lat: 11.52, lng: 77.34, tone: "start" },
          { name: "Kunderipallam Dam", lat: 11.55, lng: 77.38, tone: "end" },
        ],
        steps: [
          { label: "Check dam water release timing", done: true },
          { label: "Pack change of clothes for falls", done: false },
        ],
        packing: [
          { label: "Towel and extra clothes", done: true },
          { label: "Waterproof phone pouch", done: false },
        ],
      },
      {
        plan_id: "plan_shopping_spree",
        title: "Erode Shopping & Style Walk",
        category: "Adventure",
        duration: "2 days",
        created_date: "Apr 18, 2025",
        thumbnail_url: shopReel?.thumbnail_url || "/frames/%F0%9F%91%9F%E2%9C%A8%20%E0%AE%85%E0%AE%9F%20%E0%AE%85%E0%AE%9F%21%20%E0%AE%8E%E0%AE%A9%E0%AF%8D%E0%AE%A9%20%E0%AE%95%E0%AE%B2%E0%AF%86%E0%AE%95%E0%AF%8D%E0%AE%B7%E0%AE%A9%E0%AF%8D%E0%AE%B8%E0%AF%8D%20%F0%9F%98%8DErode%20Bus%20Stand%20%E0%AE%AA%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AF%81%E0%AE%B2%E0%AF%87%20%E0%AE%B5%E0%AE%A8%E0%AF%8D%E0%AE%A4%E0%AF%81%E0%AE%9F%E0%AF%81%E0%AE%9A%E0%AF%8D%E0%AE%9A%E0%AF%81%20Mozzo%20Footwear-oda%20%E0%AE%AA%E0%AF%81%E0%AE%A4%E0%AE%BF%E0%AE%AF%202nd%20%281%29/frame_001.jpg",
        overview: "Explore the bustling commercial spots of Erode, from trending footwear to Korean apparel.",
        timeline: [
          { label: "KBC Beauty Cosmetics", detail: "Wholesale cosmetic and beauty shop visit", tone: "start" },
          { label: "Mozzo Footwear", detail: "Check out footwear collection near bus stand", tone: "mid" },
          { label: "Korean Outfit Erode", detail: "Explore unique dress and Korean styles", tone: "end" },
        ],
        locations: [
          { name: "KBC Cosmetics", lat: 11.34, lng: 77.72, tone: "start" },
          { name: "Mozzo Footwear", lat: 11.35, lng: 77.73, tone: "end" },
        ],
        steps: [
          { label: "Note store opening hours", done: true },
          { label: "Carry cloth shopping bags", done: false },
        ],
        packing: [
          { label: "Shopping tote", done: true },
          { label: "Comfortable walking shoes", done: true },
        ],
      },
    ];
  }, [reels]);

  // Display user's created plans if any, else default grounded plans
  const displayPlans = useMemo(() => {
    if (plans && plans.length > 0) {
      return enrichPlanWithReelFrames(plans);
    }
    return defaultPlans;
  }, [plans, defaultPlans, reels]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || crafting) return;
    onCraft?.(prompt.trim());
    setPrompt("");
  };

  return (
    <div className="relative pb-16 space-y-8">
      {/* Scenic Coastal Banner Header covering the entire hero landing section */}
      <div className="relative min-h-[460px] sm:min-h-[520px] w-full overflow-hidden rounded-3xl bg-cover bg-center border border-sky-200/60 shadow-lg flex flex-col justify-between p-6 sm:p-12"
        style={{ backgroundImage: "url('/plans-bg.jpg')" }}
      >
        {/* Soft atmospheric gradient wash ensuring the scenic image covers the whole hero while keeping text crisp */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-sky-100/35 to-sky-900/40 pointer-events-none" />

        {/* Top Content Row */}
        <div className="relative z-10 flex flex-col justify-between sm:flex-row sm:items-start gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1 text-xs font-bold text-[#0284c7] backdrop-blur-md shadow-xs border border-white/50 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#0284c7]" />
              <span>AI-Powered Itinerary Planner</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl drop-shadow-xs">
              Plan Your Next Adventure
            </h1>
            <p className="mt-2.5 text-base sm:text-lg font-medium text-slate-800 max-w-xl leading-relaxed drop-shadow-xs">
              Turn your saved moments into meaningful trips, itineraries, and unforgettable experiences.
            </p>
          </div>

          {/* Top-Right Decorative "Explore Plan Relive ♡" */}
          <div className="select-none pointer-events-none self-end sm:self-auto flex items-center gap-2 text-right">
            <span className="font-serif italic text-base sm:text-lg text-[#0369a1] font-semibold leading-tight block drop-shadow-xs">
              Explore<br />
              Plan<br />
              Relive ♡
            </span>
          </div>
        </div>

        {/* Floating AI Prompt Bar at base of Hero */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 mt-8 flex flex-col sm:flex-row items-center gap-3 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md p-3 sm:p-4 shadow-2xl border border-white/80"
        >
          <div className="flex flex-1 items-center gap-3 px-3 w-full">
            <Sparkles className="h-5 w-5 text-[#2563eb] shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Where would you like to go? (e.g., Plan my weekend in Chennai, food trip in Bangalore...)"
              className="w-full text-sm sm:text-base text-slate-900 font-medium placeholder-slate-400 focus:outline-none bg-transparent"
              disabled={crafting}
            />
          </div>

          <button
            type="submit"
            disabled={crafting || !prompt.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-7 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {crafting ? "Crafting Plan..." : "Create Plan"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* "Your Plans" White Container Section */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Your Plans
          </h2>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563eb] hover:text-blue-800 transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* 3-Column Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPlans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan}
              onToggleStep={onToggleStep}
              onTogglePacking={onTogglePacking}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
