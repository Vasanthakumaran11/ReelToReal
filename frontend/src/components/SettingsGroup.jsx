import { ChevronRight } from "lucide-react";

export default function SettingsGroup({ title, icon: Icon, rows = [], children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
        {Icon && <Icon className="h-4 w-4 text-ink-500" />}
        {title}
      </h3>

      {children}

      {rows.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100">
          {rows.map(({ label, icon: RowIcon, onClick }) => (
            <li key={label}>
              <button
                type="button"
                onClick={onClick}
                className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-2.5 text-left text-sm text-ink-700 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  {RowIcon && <RowIcon className="h-4 w-4 text-ink-500" />}
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-ink-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
