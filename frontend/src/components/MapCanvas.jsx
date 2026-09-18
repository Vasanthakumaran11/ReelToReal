// A dependency-free, key-free map of the south Indian peninsula.
// Swap in Mapbox or Leaflet later — the props stay the same.

const BOUNDS = { west: 73.2, east: 81.6, south: 7.6, north: 16.4 };
const W = 800;
const H = 560;

function project([lng, lat]) {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * W;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * H;
  return [x, y];
}

// Simplified peninsula outline, west coast down to Kanyakumari and back up the east.
const COASTLINE = [
  [73.6, 16.4], [73.9, 15.6], [74.3, 14.8], [74.6, 13.9], [74.9, 13.0],
  [75.2, 12.2], [75.6, 11.5], [76.0, 10.8], [76.3, 10.0], [76.8, 9.2],
  [77.2, 8.5], [77.6, 8.0], [78.2, 8.6], [78.8, 9.3], [79.3, 10.3],
  [79.8, 11.2], [80.1, 12.2], [80.3, 13.2], [80.2, 14.1], [80.6, 15.1],
  [81.0, 16.0], [81.2, 16.4],
];

const HIGHLIGHT = [
  [76.2, 11.6], [77.0, 11.5], [77.4, 11.0], [77.1, 10.4],
  [76.4, 10.3], [75.9, 10.9],
];

const TONE_FILL = {
  start: "#16a34a",
  mid: "#f59e0b",
  end: "#dc2626",
  default: "#2563eb",
};

function toPath(points, close) {
  const d = points.map(project).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return close ? `${d} Z` : d;
}

export default function MapCanvas({
  locations = [],
  route = false,
  areas = false,
  labels = true,
  activeId,
  onSelect,
  className = "",
}) {
  // Close the outline along the northern edge so land fills inland, not the sea.
  const landPath = `${toPath(COASTLINE)} L${W},0 L0,0 Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`Map of ${locations.map((l) => l.name).join(", ")}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={W} height={H} fill="#bfdcef" />
      <path d={landPath} fill="#e4ead9" stroke="#a9bfcc" strokeWidth="1.5" />

      {areas && <path d={toPath(HIGHLIGHT, true)} fill="#c8b89a" fillOpacity="0.55" />}

      {route && locations.length > 1 && (
        <path
          d={toPath(locations.map((l) => [l.lng, l.lat]))}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeDasharray="7 6"
          strokeLinecap="round"
        />
      )}

      {locations.map((loc) => {
        const [x, y] = project([loc.lng, loc.lat]);
        const fill = TONE_FILL[loc.tone] || TONE_FILL.default;
        const isActive = activeId === loc.id;
        const Tag = onSelect ? "g" : "g";
        return (
          <Tag
            key={loc.id || loc.name}
            transform={`translate(${x} ${y})`}
            onClick={onSelect ? () => onSelect(loc) : undefined}
            className={onSelect ? "cursor-pointer" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? "button" : undefined}
            aria-label={onSelect ? loc.label || loc.name : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(loc);
                    }
                  }
                : undefined
            }
          >
            {isActive && <circle r="17" fill={fill} fillOpacity="0.22" />}
            <path
              d="M0 2 C-9 -6 -12 -12 -12 -17 A12 12 0 1 1 12 -17 C12 -12 9 -6 0 2 Z"
              fill={fill}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cy="-17" r="4.5" fill="#ffffff" />
            {labels && (
              <text
                y="20"
                textAnchor="middle"
                fontSize="15"
                fontWeight="600"
                fill="#1f2937"
                stroke="#ffffff"
                strokeWidth="3.5"
                paintOrder="stroke"
              >
                {loc.name}
              </text>
            )}
          </Tag>
        );
      })}
    </svg>
  );
}
