import { Play } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 shadow-sm">
        <Play className="h-5 w-5 fill-white text-white" />
      </span>
      <span className="leading-tight">
        <span className="block text-xl font-bold text-brand-600">ReelToReal</span>
        <span className="block text-[11px] text-ink-500">Save. Search. Plan.</span>
      </span>
    </div>
  );
}
