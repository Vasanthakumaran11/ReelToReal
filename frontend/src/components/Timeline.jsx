const TONE = {
  start: "bg-emerald-500",
  end: "bg-rose-500",
  default: "bg-brand-600",
};

export default function Timeline({ label, stages = [] }) {
  return (
    <div>
      {label && <p className="text-center text-xs text-ink-500">{label}</p>}
      <ol className="relative mt-3 flex justify-between">
        <span
          className="absolute left-[8%] right-[8%] top-[9px] h-0.5 bg-slate-200"
          aria-hidden="true"
        />
        {stages.map((stage) => (
          <li key={stage.label} className="relative flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`h-5 w-5 rounded-full ring-4 ring-white ${
                TONE[stage.tone] || TONE.default
              }`}
            />
            <span className="text-center text-[11px] font-semibold leading-tight text-ink-900">
              {stage.label}
            </span>
            {stage.detail && (
              <span className="text-center text-[11px] leading-tight text-ink-500">
                {stage.detail}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
