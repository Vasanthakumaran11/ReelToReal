/**
 * Format helpers for categories, duration, and visual gradients.
 */

const CATEGORY_LABELS = {
  food_and_drink: "Food & Drink",
  travel: "Travel",
  activity: "Activity",
  shopping: "Shopping",
  lifestyle: "Lifestyle",
  culture: "Culture",
  entertainment: "Entertainment",
};

const CATEGORY_GRADIENTS = {
  food_and_drink: "from-amber-400 via-orange-500 to-rose-500",
  travel: "from-sky-400 via-blue-500 to-indigo-600",
  activity: "from-emerald-400 via-teal-500 to-cyan-600",
  shopping: "from-fuchsia-400 via-purple-500 to-pink-500",
  lifestyle: "from-rose-400 via-pink-500 to-purple-600",
  culture: "from-violet-400 via-purple-500 to-indigo-600",
};

/**
 * Returns a human-friendly category label.
 */
export function categoryLabel(category) {
  if (!category) return "General";
  const key = String(category).toLowerCase().trim();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];

  // Fallback: convert snake_case or kebab-case to Title Case
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns Tailwind gradient classes for visual reel cards.
 */
export function categoryGradient(category) {
  if (!category) return "from-brand-400 via-brand-600 to-indigo-600";
  const key = String(category).toLowerCase().trim();
  return CATEGORY_GRADIENTS[key] || "from-brand-400 via-brand-600 to-indigo-600";
}

/**
 * Formats duration in seconds to m:ss format.
 */
export function formatDuration(seconds) {
  const sec = Math.round(Number(seconds) || 0);
  if (sec <= 0) return "0:00";
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${mins}:${remSec < 10 ? "0" : ""}${remSec}`;
}
