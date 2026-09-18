import { useState } from "react";
import { Clock, MoreVertical } from "lucide-react";
import Timeline from "./Timeline.jsx";
import Checklist from "./Checklist.jsx";
import ItineraryTable from "./ItineraryTable.jsx";
import MapCanvas from "./MapCanvas.jsx";

export default function PlanCard({ plan, onToggleStep, onTogglePacking }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-ink-900">{plan.title}</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`Actions for ${plan.title}`}
            aria-expanded={menuOpen}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-50"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <ul className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
              {["Rename", "Duplicate", "Export", "Delete"].map((action) => (
                <li key={action}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className={`w-full px-3 py-1.5 text-left hover:bg-slate-50 ${
                      action === "Delete" ? "text-rose-600" : "text-ink-700"
                    }`}
                  >
                    {action}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {plan.timeline && (
        <section className="mt-4">
          <h4 className="text-sm font-semibold text-ink-900">Timeline</h4>
          <div className="mt-2">
            <Timeline label={plan.timeline_label} stages={plan.timeline} />
          </div>
        </section>
      )}

      {plan.itinerary && (
        <section className="mt-4 grid gap-4 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <h4 className="text-sm font-semibold text-ink-900">{plan.itinerary_label}</h4>
            <div className="mt-2">
              <ItineraryTable rows={plan.itinerary} />
            </div>
          </div>
          <div className="space-y-3">
            {plan.overview && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-ink-900">Overview</p>
                <p className="mt-1 text-[13px] text-ink-700">{plan.overview}</p>
              </div>
            )}
            {plan.locations && (
              <div className="h-40 overflow-hidden rounded-lg border border-slate-200">
                <MapCanvas locations={plan.locations} route labels={false} />
              </div>
            )}
          </div>
        </section>
      )}

      {plan.key_dates && (
        <section className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div>
            <h4 className="text-sm font-semibold text-ink-900">Key dates</h4>
            <ul className="mt-2 space-y-3">
              {plan.key_dates.map((d, i) => (
                <li key={i} className="text-[13px]">
                  <p className="flex items-center gap-1.5 font-medium text-ink-900">
                    <Clock className="h-3.5 w-3.5 text-ink-500" />
                    {d.date}
                  </p>
                  <p className="ml-5 text-ink-700">{d.window}</p>
                  {d.note && <p className="ml-5 text-ink-500">{d.note}</p>}
                </li>
              ))}
            </ul>
          </div>
          {plan.locations && (
            <div className="h-44 overflow-hidden rounded-lg border border-slate-200">
              <MapCanvas locations={plan.locations} route labels={false} />
            </div>
          )}
        </section>
      )}

      {plan.steps && (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <Checklist
            title="Actionable steps"
            items={plan.steps}
            onToggle={(i) => onToggleStep?.(plan.plan_id, i)}
          />
        </section>
      )}

      {plan.packing && (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <Checklist
            title="Packing list"
            items={plan.packing}
            onToggle={(i) => onTogglePacking?.(plan.plan_id, i)}
          />
        </section>
      )}
    </article>
  );
}
