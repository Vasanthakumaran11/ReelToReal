export default function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-[15px] font-semibold text-ink-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{body}</p>
      {action}
    </div>
  );
}
