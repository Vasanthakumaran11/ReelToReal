import { Plus } from "lucide-react";
import PlanCard from "../components/PlanCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Plans({ plans, onStart, onToggleStep, onTogglePacking }) {
  if (!plans.length) {
    return (
      <EmptyState
        title="No plans yet"
        body="Describe a place or activity on the Explore AI tab and the answer is kept here as a plan."
        action={
          <button
            type="button"
            onClick={onStart}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create new plan
          </button>
        }
      />
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink-900">My comprehensive plans</h2>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create new plan
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.plan_id}
            plan={plan}
            onToggleStep={onToggleStep}
            onTogglePacking={onTogglePacking}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create new plan
        </button>
      </div>
    </section>
  );
}
