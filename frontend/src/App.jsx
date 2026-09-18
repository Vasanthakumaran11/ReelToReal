import { useCallback, useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import SavedItems from "./pages/SavedItems.jsx";
import Plans from "./pages/Plans.jsx";
import ExploreAI from "./pages/ExploreAI.jsx";
import Settings from "./pages/Settings.jsx";
import { craftPlan, fetchPlans, fetchReels } from "./lib/api.js";

export default function App() {
  const [tab, setTab] = useState("saved");
  const [reels, setReels] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, p] = await Promise.all([fetchReels(), fetchPlans()]);
        if (cancelled) return;
        setReels(r);
        setPlans(p);
      } catch (err) {
        if (!cancelled) setError("Couldn't load your reels. Check that the API is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = useCallback((videoId) => {
    setReels((list) =>
      list.map((r) => (r.video_id === videoId ? { ...r, saved: !r.saved } : r))
    );
  }, []);

  const toggleChecklist = useCallback((key) => (planId, index) => {
    setPlans((list) =>
      list.map((p) =>
        p.plan_id === planId
          ? {
              ...p,
              [key]: p[key].map((item, i) =>
                i === index ? { ...item, done: !item.done } : item
              ),
            }
          : p
      )
    );
  }, []);

  const handleCraft = useCallback(async (question) => {
    setCrafting(true);
    setError("");
    try {
      const plan = await craftPlan(question);
      setPlans((list) => [plan, ...list]);
      setTab("plans");
    } catch (err) {
      setError("The plan didn't come back. Try again in a moment.");
    } finally {
      setCrafting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header active={tab} onChange={setTab} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            {error}
          </p>
        )}

        {tab === "saved" && (
          <SavedItems
            reels={reels}
            loading={loading}
            onToggleSave={toggleSave}
            onAddReel={() => setTab("explore")}
          />
        )}

        {tab === "plans" && (
          <Plans
            plans={plans}
            onStart={() => setTab("explore")}
            onToggleStep={toggleChecklist("steps")}
            onTogglePacking={toggleChecklist("packing")}
          />
        )}

        {tab === "explore" && (
          <ExploreAI
            reels={reels}
            crafting={crafting}
            onCraft={handleCraft}
            onToggleSave={toggleSave}
            onHistory={() => setTab("plans")}
            onIngested={(record) => setReels((list) => [record, ...list])}
          />
        )}

        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}
