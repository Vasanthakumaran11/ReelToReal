import { useState } from "react";
import { Bookmark, ChevronDown, Settings, SquareStack, Upload, Menu } from "lucide-react";
import Logo from "./Logo.jsx";

const TABS = [
  { id: "saved", label: "Saved Items", icon: Bookmark },
  { id: "plans", label: "Plans", icon: SquareStack },
  { id: "explore", label: "Explore AI", icon: Upload },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Header({ active, onChange, user = "Alex" }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 ring-1 ring-slate-200">
              {user.slice(0, 1)}
            </span>
            <span className="hidden text-sm font-medium text-ink-700 sm:block">{user}</span>
            <ChevronDown className="h-4 w-4 text-ink-500" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-ink-700 hover:bg-slate-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 px-4 py-2 md:hidden" aria-label="Main">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active === id ? "bg-brand-50 text-brand-700" : "text-ink-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
