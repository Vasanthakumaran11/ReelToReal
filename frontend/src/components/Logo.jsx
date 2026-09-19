import { Play } from "lucide-react";

export default function Logo({ theme = "blue" }) {
  const isEmerald = theme === "emerald";
  const bgClass = isEmerald ? "bg-[#10b981]" : "bg-[#2563eb]";
  const textClass = isEmerald ? "text-[#059669]" : "text-[#2563eb]";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${bgClass} shadow-xs`}>
        <Play className="h-5 w-5 fill-white text-white ml-0.5" />
      </span>
      <span className="leading-tight">
        <span className={`block text-xl font-bold tracking-tight ${textClass}`}>ReelToReal</span>
        <span className="block text-[11px] font-medium text-slate-500">Save. Search. Plan.</span>
      </span>
    </div>
  );
}
