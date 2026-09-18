// Plans built from one or more saved reels. Shape matches what /api/plans returns.

export const samplePlans = [
  {
    plan_id: "plan_velliangiri",
    title: "Velliangiri Hike Expedition",
    question: "How do I get to the Velliangiri hike?",
    created_at: "2026-09-14",
    reel_ids: ["yt_velliangiri_hike", "yt_velliangiri_prep"],
    timeline_label: "Velliangiri hike in four stages",
    timeline: [
      { label: "Trailhead", detail: "Poondi base camp", tone: "start" },
      { label: "Hill two", detail: "First water point" },
      { label: "Hill five", detail: "Steep rock section" },
      { label: "Summit", detail: "Seventh hill", tone: "end" },
    ],
    key_dates: [
      { date: "Dec 15, 2026", window: "4:00 am departure", note: "Drive from Coimbatore" },
      { date: "Dec 15, 2026", window: "6:00 am - 4:00 pm", note: "Climb and descent" },
    ],
    locations: [
      { name: "Coimbatore", lat: 11.02, lng: 76.96, tone: "start" },
      { name: "Velliangiri Hills", lat: 10.95, lng: 76.68, tone: "end" },
    ],
    steps: [
      { label: "Book a guide at the base camp", done: true },
      { label: "Pack two litres of water per person", done: true },
      { label: "Check the weather the night before", done: true },
      { label: "Register before the 10am entry cut-off", done: false },
      { label: "Book a Coimbatore stay for the same night", done: false },
    ],
  },
  {
    plan_id: "plan_chennai_weekend",
    title: "Chennai Weekend Exploration",
    question: "Plan a Saturday around the filter coffee reel",
    created_at: "2026-09-02",
    reel_ids: ["ig_chennai_filter_coffee", "yt_chennai_beach_day"],
    itinerary_label: "2-day itinerary",
    itinerary: [
      { day: 1, activity: "Sunrise walk", location: "Marina Beach" },
      { day: 1, activity: "Filter coffee", location: "Mylapore" },
      { day: 1, activity: "Temple tank loop", location: "Kapaleeshwarar" },
      { day: 2, activity: "Drive south", location: "East Coast Road" },
      { day: 2, activity: "Swim", location: "Kovalam Beach" },
      { day: 2, activity: "Late lunch", location: "Thiruvanmiyur" },
    ],
    overview: "Two mornings on the coast, two coffee stops, one drive down ECR.",
    locations: [
      { name: "Chennai", lat: 13.08, lng: 80.27, tone: "start" },
      { name: "Kovalam", lat: 12.79, lng: 80.25, tone: "end" },
    ],
    packing: [
      { label: "Swimwear and a towel", done: false },
      { label: "Sunscreen", done: false },
      { label: "Cash for the coffee counters", done: false },
      { label: "Light shirt for the temple", done: false },
    ],
  },
];

/** Suggestions shown beside the Explore AI composer. */
export const inspirationPrompts = [
  "A cafe in Chennai with the best filter coffee",
  "A weekend hike near Coimbatore",
  "Where to find desserts in Bangalore after 9pm",
  "A beach day I can do without a car",
];

/** Saved map locations, grouped the way the map panel lists them. */
export const mapLocations = [
  {
    id: "loc_chennai_coffee",
    name: "Chennai",
    label: "Chennai (Beach & Coffee)",
    lat: 13.08,
    lng: 80.27,
    tone: "start",
    reel_id: "ig_chennai_filter_coffee",
  },
  {
    id: "loc_coimbatore",
    name: "Coimbatore",
    label: "Coimbatore (Hike & Food)",
    lat: 11.02,
    lng: 76.96,
    tone: "mid",
    reel_id: "yt_velliangiri_hike",
  },
  {
    id: "loc_bangalore",
    name: "Bangalore",
    label: "Bangalore (Desserts)",
    lat: 12.97,
    lng: 77.59,
    tone: "end",
    reel_id: "ig_bangalore_desserts",
  },
];

export const mapLayers = [
  { id: "activity_zones", label: "Saved place markers", on: true },
  { id: "routes", label: "Routes between stops", on: true },
  { id: "areas", label: "Trip area highlighting", on: false },
  { id: "labels", label: "City labels", on: true },
];
