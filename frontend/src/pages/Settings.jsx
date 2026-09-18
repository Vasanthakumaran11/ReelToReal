import { useState } from "react";
import {
  BarChart3,
  Bell,
  CreditCard,
  Download,
  Globe,
  KeyRound,
  Lock,
  Contrast,
  Pencil,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
  User,
  Users,
} from "lucide-react";
import SettingsGroup from "../components/SettingsGroup.jsx";
import UsageMap from "../components/UsageMap.jsx";

export default function Settings({ user = "Alex", city = "Bangalore" }) {
  const [theme, setTheme] = useState("Light");

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-start justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
            <User className="h-5 w-5 text-ink-500" />
            User profile
          </h2>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-slate-50"
          >
            Edit
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center">
          <div className="relative">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 ring-1 ring-slate-200">
              {user.slice(0, 1)}
            </span>
            <button
              type="button"
              aria-label="Change photo"
              className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-ink-700 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-3 text-base font-bold text-ink-900">{user}</p>
          <p className="text-sm text-ink-500">{city}</p>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <SettingsGroup
          title="Account and security"
          icon={ShieldCheck}
          rows={[
            { label: "Password", icon: KeyRound },
            { label: "Two-factor authentication", icon: Lock },
            { label: "Connected accounts", icon: Users },
          ]}
        />

        <SettingsGroup title="Data and usage" icon={BarChart3}>
          <div className="mt-3 h-32 overflow-hidden rounded-lg">
            <UsageMap />
          </div>
          <ul className="mt-2 divide-y divide-slate-100">
            {[
              { label: "Export your reels and plans", icon: Download },
              { label: "Delete saved reels", icon: Trash2 },
              { label: "Privacy settings", icon: ShieldQuestion },
            ].map(({ label, icon: Icon }) => (
              <li key={label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-md px-1 py-2.5 text-left text-sm text-ink-700 hover:bg-slate-50"
                >
                  <Icon className="h-4 w-4 text-ink-500" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </SettingsGroup>

        <SettingsGroup title="App preferences" icon={Contrast}>
          <ul className="mt-2 divide-y divide-slate-100">
            <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex items-center gap-2.5 text-ink-700">
                <Contrast className="h-4 w-4 text-ink-500" />
                Theme
              </span>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                {["Light", "Dark", "System"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      theme === t ? "bg-brand-600 text-white" : "text-ink-700 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </li>
            {[
              { label: "Notifications", icon: Bell, value: "Plan updates only" },
              { label: "Language", icon: Globe, value: "English" },
            ].map(({ label, icon: Icon, value }) => (
              <li key={label}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-2.5 text-left text-sm hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2.5 text-ink-700">
                    <Icon className="h-4 w-4 text-ink-500" />
                    {label}
                  </span>
                  <span className="text-ink-500">{value}</span>
                </button>
              </li>
            ))}
          </ul>
        </SettingsGroup>

        <SettingsGroup title="Subscription" icon={CreditCard}>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-ink-900">Current plan</p>
            <p className="mt-0.5 text-sm text-ink-500">Free — 20 saved reels a month</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Upgrade
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-white"
              >
                Manage
              </button>
            </div>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}
