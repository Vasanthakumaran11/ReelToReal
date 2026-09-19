import { useState } from "react";
import { Bookmark, ChevronDown, Settings, Link2, Sparkles, Menu } from "lucide-react";
import Logo from "./Logo.jsx";

const TABS = [
  { id: "plans", label: "Plans", icon: Link2 },
  { id: "saved", label: "Saved Items", icon: Bookmark },
  { id: "explore", label: "Explore AI", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Header({ active, onChange, user = "Alex" }) {
  const [open, setOpen] = useState(false);

  const getTabClasses = (id) => {
    const isActive = active === id;
    if (!isActive) return "text-slate-600 hover:text-slate-900 hover:bg-black/5";
    if (id === "plans") return "border border-blue-200 bg-[#e0edff] text-[#2563eb] font-medium shadow-xs";
    if (id === "saved") return "border border-rose-200 bg-[#fff0f2] text-[#e83d57] font-medium shadow-xs";
    if (id === "explore") return "border border-indigo-200 bg-[#eef2ff] text-[#4f46e5] font-medium shadow-xs";
    if (id === "settings") return "border border-emerald-200 bg-[#d8f3e5] text-[#059669] font-medium shadow-xs";
    return "border border-slate-200 bg-slate-100 text-slate-800 font-medium";
  };

  const getLogoTheme = () => {
    if (active === "settings") return "emerald";
    if (active === "saved") return "blue";
    return "blue";
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo theme={getLogoTheme()} />

        <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${getTabClasses(
                  id
                )}`}
              >
                <Icon className={`h-4 w-4 ${isActive && id === "saved" ? "fill-[#e83d57]" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100/60 transition-colors"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#2563eb]">
              {user.slice(0, 1)}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{user}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
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
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${getTabClasses(
                id
              )}`}
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
