import subprocess
import json
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from config import get_tool_path
from schema import IngestionFailure

def validate_video_file(
    file_path: Path,
    video_id: str,
    source_type: str = "upload",
    source_url: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[dict]]:
    """
    Validates a video file using ffprobe per Step 3.
    Returns (validation_metadata, None) on success, or (None, failure_dict) on failure.
    """
    ffprobe_cmd = get_tool_path("ffprobe")

    cmd = [
        ffprobe_cmd,
        "-v", "error",
        "-show_format",
        "-show_streams",
        "-of", "json",
        str(file_path)
    ]

    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")

    stdout_str = (res.stdout or "").strip()
    stderr_str = (res.stderr or "").strip()

    if res.returncode != 0 or not stdout_str:
        failure = IngestionFailure(
            video_id=video_id,
            status="failed",
            failure_stage="validation",
            error=stderr_str or "ffprobe failed to read video file.",
            fallback_action=None,
            source_type=source_type,
            source_url=source_url,
        ).model_dump()
        return None, failure

    try:
        probe_data = json.loads(stdout_str)
    except json.JSONDecodeError as e:
        failure = IngestionFailure(
            video_id=video_id,
            status="failed",
            failure_stage="validation",
            error=f"Failed to parse ffprobe JSON output: {str(e)}",
            fallback_action=None,
            source_type=source_type,
            source_url=source_url,
        ).model_dump()
        return None, failure

    streams = probe_data.get("streams", [])
    format_info = probe_data.get("format", {})

    video_streams = [s for s in streams if s.get("codec_type") == "video"]
    audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

    if not video_streams:
        failure = IngestionFailure(
            video_id=video_id,
            status="failed",
            failure_stage="validation",
            error="Validation failed: Video contains no video streams.",
            fallback_action=None,
            source_type=source_type,
            source_url=source_url,
        ).model_dump()
        return None, failure

    # Duration check: from format or stream
    duration_str = format_info.get("duration") or (video_streams[0].get("duration") if video_streams else None)
    try:
        duration = float(duration_str) if duration_str else 0.0
    except (ValueError, TypeError):
        duration = 0.0

    if duration <= 0:
        failure = IngestionFailure(
            video_id=video_id,
            status="failed",
            failure_stage="validation",
            error=f"Validation failed: Invalid duration ({duration}s). Duration must be greater than 0.",
            fallback_action=None,
            source_type=source_type,
            source_url=source_url,
        ).model_dump()
        return None, failure

    audio_present = len(audio_streams) > 0

    return {
        "duration": duration,
        "size_bytes": file_path.stat().st_size,
        "audio_present": audio_present,
        "video_codec": video_streams[0].get("codec_name"),
        "audio_codec": audio_streams[0].get("codec_name") if audio_present else None,
        "width": video_streams[0].get("width"),
        "height": video_streams[0].get("height"),
    }, None
