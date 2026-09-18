// Where saved reels come from, by region. Illustrative, no tiles required.
const REGIONS = [
  { d: "M20,38 L48,26 L74,32 L84,52 L70,74 L44,80 L24,64 Z" },
  { d: "M96,30 L124,20 L150,28 L152,52 L132,70 L106,64 L92,48 Z" },
  { d: "M118,74 L142,72 L156,92 L146,120 L126,124 L112,100 Z" },
  { d: "M158,34 L206,22 L248,34 L262,58 L232,86 L186,84 L162,60 Z" },
  { d: "M206,92 L244,94 L252,116 L232,130 L210,120 Z" },
];

const POINTS = [
  { cx: 168, cy: 62, r: 6 },
  { cx: 196, cy: 74, r: 9 },
  { cx: 62, cy: 52, r: 4 },
];

export default function UsageMap() {
  return (
    <svg viewBox="0 0 280 140" className="h-full w-full" role="img" aria-label="Saved reels by region">
      <rect width="280" height="140" rx="8" fill="#eef5ff" />
      {REGIONS.map((r, i) => (
        <path key={i} d={r.d} fill="#a7d5a7" stroke="#8cc38c" strokeWidth="1" />
      ))}
      {POINTS.map((p, i) => (
        <circle key={i} {...p} fill="#2563eb" fillOpacity="0.75" />
      ))}
    </svg>
  );
}
