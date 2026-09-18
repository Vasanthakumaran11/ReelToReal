import sys
import json
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from config import VIDEOS_DIR
from pipeline import run_ingestion_pipeline, check_environment

def main():
    parser = argparse.ArgumentParser(
        description="ReelToReal Ingestion Agent - Process short-form video (URL or local file) into structured data."
    )
    parser.add_argument(
        "input",
        nargs="?",
        help="Video URL (Instagram Reel, YouTube Short, TikTok) or local file path."
    )
    parser.add_argument(
        "--url",
        dest="url_flag",
        help="Explicit video URL to ingest."
    )
    parser.add_argument(
        "--file",
        dest="file_flag",
        help="Explicit local file path to ingest."
    )
    parser.add_argument(
        "--id",
        dest="custom_id",
        help="Custom video ID to associate with this record."
    )
    parser.add_argument(
        "--check-env",
        action="store_true",
        help="Perform Step 0 Environment Check and exit."
    )

    args = parser.parse_args()

    if args.check_env:
        ok, err = check_environment()
        if ok:
            print(json.dumps({"status": "ready", "step": "0", "message": "All required tools (yt-dlp, ffmpeg, ffprobe) are available and verified."}, indent=2))
            sys.exit(0)
        else:
            print(json.dumps({"status": "failed", "step": "0", "error": err}, indent=2), file=sys.stderr)
            sys.exit(1)

    input_source = args.url_flag or args.file_flag or args.input
    if not input_source:
        # Check for uploaded videos in videos/ directory
        uploaded = [f for f in VIDEOS_DIR.glob("*.mp4") if f.name != "test_reel.mp4"]
        if not uploaded:
            uploaded = list(VIDEOS_DIR.glob("*.mp4"))
        if uploaded:
            latest_video = max(uploaded, key=lambda f: f.stat().st_mtime)
            input_source = str(latest_video)
        else:
            parser.print_help()
            sys.exit(1)

    result = run_ingestion_pipeline(input_source, custom_video_id=args.custom_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    if result.get("status") != "success":
        sys.exit(2)

if __name__ == "__main__":
    main()
