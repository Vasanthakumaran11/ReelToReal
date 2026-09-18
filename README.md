# ReelToReal Ingestion Agent

A resilient ingestion engine and pipeline for **ReelToReal**, transforming short-form videos (Instagram Reels, YouTube Shorts, TikToks, or direct uploads) into structured, grounded JSON records for semantic retrieval and itinerary/action planning.

## Pipeline Architecture

The ingestion pipeline executes the 7 distinct stages strictly in sequence:

1. **Step 0 — Environment Check**: Verifies `yt-dlp`, `ffmpeg`, and `ffprobe`.
2. **Step 1 — Input Type Detection**: Distinguishes between web URLs (Instagram, YouTube, TikTok) and local file uploads.
3. **Step 2 — Download via yt-dlp**: Downloads the best MP4 stream (`best[ext=mp4]/best`). Retries once with verbose logging (`-v`). If extraction fails (e.g. Instagram login wall or extractor block), gracefully halts with `fallback_action: "request_direct_upload"` and verbatim stderr.
4. **Step 3 — Video Validation**: Inspects the media using `ffprobe`. Verifies presence of video stream, notes audio presence (silent videos are supported), and asserts duration > 0.
5. **Step 4 — Multimodal Sizing Check**: Evaluates duration and file size against multimodal API limits.
   - **Direct Video Mode**: Files within limits (< 3 min, < 50 MB) are passed directly to the model.
   - **Frame Extraction Mode**: Files exceeding limits trigger keyframe scene-detection (`select='gt(scene,0.4)'`) and audio separation (`libmp3lame`).
6. **Step 5 — Multimodal Structured Extraction**: Uses Google Gemini (`gemini-2.5-flash`) with API-enforced JSON schema (`ReelToRealExtraction`). Grounded extraction covering categories, places, cuisines, dishes, travel destinations, tips, OCR, transcripts, and semantic summaries.
7. **Step 6 — Metadata Attachment**: Merges model predictions with pipeline metadata (`video_id`, `status`, `source_type`, `source_url`, `ingested_at`, `audio_present`, `duration_seconds`) and stores the output in `outputs/{video_id}.json`.

---

## Schema Reference

### Success Record (`status: "success"`)
```json
{
  "video_id": "ig_C_Example123",
  "status": "success",
  "source_type": "url",
  "source_url": "https://www.instagram.com/reel/...",
  "local_file_path": ".../videos/ig_C_Example123.mp4",
  "ingested_at": "2026-09-18T17:50:00.000000+00:00",
  "audio_present": true,
  "duration_seconds": 28.5,
  "processing_mode": "direct_video",
  "category": "food_and_drink",
  "place": "Chez Janou",
  "city": "Paris",
  "country": "France",
  "cuisine": "French Bistro",
  "foods": ["Chocolate Mousse", "Duck Breast", "Ratatouille"],
  "destination": "Le Marais",
  "activity_name": null,
  "product_name": null,
  "tip_summary": "Order the unlimited chocolate mousse bowl; arrive 15 minutes before opening to avoid the line.",
  "objects": ["mousse bowl", "wine glass", "bistro table"],
  "transcript": "You cannot visit Paris without coming to Chez Janou...",
  "ocr_text": ["CHEZ JANOU", "PARIS 3RD", "BEST CHOCOLATE MOUSSE"],
  "summary": "Chez Janou is a classic Provençal bistro in Le Marais, Paris, famous for its giant unlimited chocolate mousse bowl and authentic French comfort dishes. Recommended to queue early before dinner service.",
  "tags": ["paris", "foodie", "chocolate mousse", "french bistro", "travel tips"]
}
```

### Failure Record (`status: "failed"`)
```json
{
  "video_id": "ig_C_Example123",
  "status": "failed",
  "failure_stage": "ingestion",
  "error": "ERROR: [Instagram] Unable to extract video. Login required.",
  "fallback_action": "request_direct_upload",
  "source_type": "url",
  "source_url": "https://www.instagram.com/reel/...",
  "ingested_at": "2026-09-18T17:50:00.000000+00:00"
}
```

---

## Quick Start

### 1. Configure Environment
Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`:
```bash
GEMINI_API_KEY="your_api_key_here"
```

### 2. Check Environment (Step 0)
```bash
python ingest.py --check-env
```

### 3. Ingest a Video URL
```bash
python ingest.py --url "https://www.youtube.com/shorts/EXAMPLE_ID"
```

### 4. Ingest a Local Video File
```bash
python ingest.py --file "path/to/my_reel.mp4"
```
