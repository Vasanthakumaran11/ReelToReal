import { Check } from "lucide-react";

export default function Checklist({ title, items = [], onToggle }) {
  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-ink-900">{title}</h4>}
      <ul className="mt-2.5 space-y-2">
        {items.map((item, i) => (
          <li key={item.label}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle?.(i)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${
                  item.done ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-white"
                }`}
              >
                {item.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <span className={item.done ? "text-ink-500 line-through" : "text-ink-700"}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
