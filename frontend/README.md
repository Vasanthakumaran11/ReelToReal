# ReelToReal Frontend

React + Tailwind interface for the ReelToReal ingestion pipeline.

## Run it

```bash
cd frontend
npm install
npm run dev
```

Opens on http://localhost:5173.

With no API configured the app runs on the sample records in
`src/data/reels.js`, which are shaped exactly like the pipeline output in
`outputs/{video_id}.json` (see `schema.py`).

## Connect it to the pipeline

Copy `.env.example` to `.env` and set the API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

The app expects these endpoints:

| Method | Path                 | Returns                                        |
|--------|----------------------|------------------------------------------------|
| GET    | `/api/reels`         | array of `IngestionSuccess` records            |
| GET    | `/api/plans`         | array of plans                                 |
| POST   | `/api/plan`          | `{ question }` in, a plan out                  |
| POST   | `/api/ingest`        | `{ source_url }` in, ingestion record out      |
| POST   | `/api/ingest/upload` | multipart `file`, ingestion record out         |

A failed ingestion record carrying `fallback_action: "request_direct_upload"`
switches the Explore AI screen over to the file upload path, matching Step 2 of
the pipeline.

Dev requests to `/api` are also proxied to `http://localhost:8000` by
`vite.config.js`, so you can leave `VITE_API_BASE_URL` blank once a server is
running there and change `BASE` handling in `src/lib/api.js` if you prefer the
proxy route.

## Layout

```
src/
  App.jsx               tab shell and data loading
  components/           Header, PlanComposer, ReelCard, PromoCard, FilterBar,
                        ReelDetail, EmptyState, Logo
  pages/                SavedItems, Plans, ExploreAI, Settings
  lib/api.js            API calls with sample-data fallback
  lib/format.js         duration, category label, thumbnail gradient helpers
  data/reels.js         sample records
```

Reel thumbnails fall back to a per-category gradient. Set `thumbnail_url` on a
record once you serve keyframes from `frames/` and the image is used instead.
