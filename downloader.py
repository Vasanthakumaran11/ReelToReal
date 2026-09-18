import subprocess
import re
import hashlib
import uuid
from pathlib import Path
from typing import Tuple, Optional
from config import get_tool_path, VIDEOS_DIR
from schema import IngestionFailure

def extract_or_generate_video_id(url: str) -> str:
    """Extract an ID from common platforms (Instagram, YouTube, TikTok) or hash."""
    # YouTube Short: youtube.com/shorts/<id> or youtu.be/<id>
    yt_match = re.search(r"(?:shorts/|v=|youtu\.be/)([a-zA-Z0-9_-]{8,15})", url)
    if yt_match:
        return f"yt_{yt_match.group(1)}"

    # Instagram Reel: instagram.com/reel/<shortcode>/ or /p/<shortcode>/
    ig_match = re.search(r"(?:reel|p)/([a-zA-Z0-9_-]+)", url)
    if ig_match:
        return f"ig_{ig_match.group(1)}"

    # TikTok: tiktok.com/@user/video/<id>
    tt_match = re.search(r"video/(\d+)", url)
    if tt_match:
        return f"tt_{tt_match.group(1)}"

    # Fallback to deterministic hash of the URL
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:12]
    return f"vid_{url_hash}"

def download_video(url: str, video_id: Optional[str] = None) -> Tuple[Optional[Path], Optional[dict]]:
    """
    Downloads a video via yt-dlp according to Step 2.
    Returns (Path, None) on success, or (None, failure_dict) on failure.
    """
    if not video_id:
        video_id = extract_or_generate_video_id(url)

    yt_dlp_cmd = get_tool_path("yt-dlp")
    ffmpeg_cmd = get_tool_path("ffmpeg")
    ffmpeg_dir = str(Path(ffmpeg_cmd).parent) if Path(ffmpeg_cmd).is_absolute() else None

    output_template = str(VIDEOS_DIR / f"{video_id}.%(ext)s")

    base_args = [
        yt_dlp_cmd,
        "-f", "best[ext=mp4]/best",
        "-o", output_template,
        "--no-playlist",
    ]
    if ffmpeg_dir:
        base_args.extend(["--ffmpeg-location", ffmpeg_dir])

    # Attempt 1: Standard download
    cmd1 = base_args + [url]
    res1 = subprocess.run(cmd1, capture_output=True, text=True, encoding="utf-8", errors="replace")

    downloaded_files = list(VIDEOS_DIR.glob(f"{video_id}.*"))
    valid_file = next((f for f in downloaded_files if f.stat().st_size > 0), None)

    if res1.returncode == 0 and valid_file:
        return valid_file, None

    # Step 2: Retry ONCE with verbose logging (-v)
    cmd2 = base_args + ["-v", url]
    res2 = subprocess.run(cmd2, capture_output=True, text=True, encoding="utf-8", errors="replace")

    downloaded_files = list(VIDEOS_DIR.glob(f"{video_id}.*"))
    valid_file = next((f for f in downloaded_files if f.stat().st_size > 0), None)

    if res2.returncode == 0 and valid_file:
        return valid_file, None

    # Both attempts failed. Return verbatim stderr and fallback action.
    combined_err = res2.stderr.strip() or res1.stderr.strip() or "yt-dlp exited non-zero or produced an empty file."
    failure = IngestionFailure(
        video_id=video_id,
        status="failed",
        failure_stage="ingestion",
        error=combined_err,
        fallback_action="request_direct_upload",
        source_type="url",
        source_url=url,
    ).model_dump()

    return None, failure
