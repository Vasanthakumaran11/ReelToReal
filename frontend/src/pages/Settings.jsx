import { useState } from "react";
import {
  User,
  Shield,
  Database,
  Sliders,
  Bell,
  Lock,
  HelpCircle,
  KeyRound,
  Users,
  Download,
  Trash2,
  ShieldCheck,
  Globe,
  Sun,
  ChevronRight,
  Headphones,
  BarChart2,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { id: "profile", label: "User Profile", icon: User },
  { id: "account", label: "Account & Security", icon: Shield },
  { id: "data", label: "Data & Storage", icon: Database },
  { id: "preferences", label: "App Preferences", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "support", label: "Help & Support", icon: HelpCircle },
];

export default function Settings({ user = "Alex", city = "Bangalore" }) {
  const [activeItem, setActiveItem] = useState("profile");
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("English");

  return (
    <div className="relative pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Left Sidebar Menu */}
        <aside className="relative flex flex-col justify-between rounded-3xl p-2 sm:p-4 min-h-[520px]">
          <nav className="space-y-1.5" aria-label="Settings Navigation">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeItem === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left ${
                    isActive
                      ? "bg-[#dcf3e6] text-[#065f46] font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-black/5 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#059669]" : "text-slate-500"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom-Left Botanical Leafy Branch Illustration + "Your memories matter ♡" */}
          <div className="mt-12 select-none pointer-events-none flex items-end gap-3 pt-6">
            <svg
              className="w-16 h-20 text-[#059669] opacity-80 shrink-0"
              viewBox="0 0 64 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 75C20 55 35 35 48 10"
                stroke="#047857"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M20 56C12 50 14 40 22 42C30 44 28 54 20 56Z"
                fill="#10b981"
                stroke="#047857"
                strokeWidth="1.5"
              />
              <path
                d="M32 44C28 34 38 28 44 32C48 36 42 46 32 44Z"
                fill="#34d399"
                stroke="#047857"
                strokeWidth="1.5"
              />
              <path
                d="M42 25C40 16 50 14 54 18C58 22 52 29 42 25Z"
                fill="#6ee7b7"
                stroke="#047857"
                strokeWidth="1.5"
              />
            </svg>
            <div className="pb-1">
              <span className="font-serif italic text-sm sm:text-base text-[#047857] font-medium leading-tight block">
                Your<br />
                memories<br />
                matter ♡
              </span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <div className="relative space-y-6">
          {/* Top-Right Decorative "Better Plans Ahead ♡" */}
          <div className="absolute -top-3 right-2 select-none pointer-events-none flex items-center gap-2 text-right">
            <span className="font-serif italic text-sm sm:text-base text-[#047857] font-medium leading-tight block">
              Better<br />
              Plans<br />
              Ahead ♡
            </span>
            <svg
              className="w-12 h-14 text-[#10b981] opacity-75"
              viewBox="0 0 48 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 50C16 35 28 20 40 8"
                stroke="#047857"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M18 36C12 30 16 22 22 24C28 26 24 36 18 36Z"
                fill="#34d399"
                stroke="#047857"
                strokeWidth="1.5"
              />
              <path
                d="M30 20C28 14 36 10 40 14C44 18 38 24 30 20Z"
                fill="#6ee7b7"
                stroke="#047857"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Top User Profile Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#dbeafe] text-2xl font-bold text-[#2563eb]">
                {user.slice(0, 1)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user}</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">{city}</p>
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Edit
            </button>
          </div>

          {/* 2x2 Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Account and Security */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-[#059669]" />
                  <h3 className="text-base font-bold text-slate-900">Account and security</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Password
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Two-factor authentication
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Connected accounts
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Data and Usage */}
            <div className="relative rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-[#059669]" />
                    <h3 className="text-base font-bold text-slate-900">Data and usage</h3>
                  </div>

                  {/* Soft mint mini bar-chart visual decoration in top right */}
                  <div className="flex items-end gap-1 h-6 pr-1 opacity-75">
                    <div className="w-1.5 h-3 rounded-t-sm bg-[#6ee7b7]" />
                    <div className="w-1.5 h-5 rounded-t-sm bg-[#10b981]" />
                    <div className="w-1.5 h-6 rounded-t-sm bg-[#047857]" />
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Export your reels and plans
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Delete saved reels
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Privacy settings
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: App Preferences */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="h-4 w-4 text-[#059669]" />
                  <h3 className="text-base font-bold text-slate-900">App preferences</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-3.5 text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-slate-400" />
                      Language
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setLanguage((l) => (l === "English" ? "Tamil" : "English"))
                      }
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <span>{language}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3.5 text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-3">
                      <Sun className="h-4 w-4 text-slate-400" />
                      Theme
                    </span>
                    <button
                      type="button"
                      onClick={() => setTheme((t) => (t === "Light" ? "Dark" : "Light"))}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <span>{theme}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Support */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-4 w-4 text-[#059669]" />
                  <h3 className="text-base font-bold text-slate-900">Support</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Help center
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <Headphones className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      Contact us
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
