import os
import json
import subprocess
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

from config import get_tool_path, OUTPUTS_DIR, VIDEOS_DIR
from schema import IngestionSuccess, IngestionFailure
from downloader import download_video, extract_or_generate_video_id
from validator import validate_video_file
from processor import prepare_video_payload
from extractor import extract_structured_data

def check_environment() -> Tuple[bool, Optional[str]]:
    """Step 0: Verify required tools (yt-dlp, ffmpeg, ffprobe) exist and respond."""
    tools = ["yt-dlp", "ffmpeg", "ffprobe"]
    for tool in tools:
        resolved = get_tool_path(tool)
        flag = "--version" if tool == "yt-dlp" else "-version"
        try:
            res = subprocess.run([resolved, flag], capture_output=True, text=True, timeout=10)
            if res.returncode != 0:
                return False, f"Tool '{tool}' returned non-zero exit code: {res.stderr.strip()}"
        except Exception as e:
            return False, f"Tool '{tool}' could not be executed: {str(e)}"
    return True, None

def run_ingestion_pipeline(
    input_source: str,
    custom_video_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the ReelToReal Ingestion Pipeline sequentially (Steps 0 through 6).
    input_source can be either:
      - A URL (Instagram Reel, YouTube Short, TikTok link)
      - A local file path on disk
    """
    ingested_at = datetime.now(timezone.utc).isoformat()

    # --- STEP 0: ENVIRONMENT CHECK ---
    env_ok, env_err = check_environment()
    if not env_ok:
        return IngestionFailure(
            video_id=custom_video_id or "unknown",
            status="failed",
            failure_stage="environment",
            error=env_err or "Required tools (yt-dlp, ffmpeg) are missing or failing.",
            fallback_action=None,
            ingested_at=ingested_at
        ).model_dump()

    # --- STEP 1: DETERMINE INPUT TYPE ---
    is_url = (
        input_source.startswith("http://") or
        input_source.startswith("https://") or
        "instagram.com" in input_source or
        "youtube.com" in input_source or
        "youtu.be" in input_source or
        "tiktok.com" in input_source
    )
    source_type = "url" if is_url else "upload"

    if is_url:
        video_id = custom_video_id or extract_or_generate_video_id(input_source)
        source_url = input_source
        # --- STEP 2: DOWNLOAD VIDEO VIA yt-dlp ---
        video_file, dl_failure = download_video(input_source, video_id=video_id)
        if dl_failure:
            dl_failure["ingested_at"] = ingested_at
            _save_output(video_id, dl_failure)
            return dl_failure
    else:
        # Step 1 (b): Direct local file upload
        local_path = Path(input_source)
        if not local_path.is_absolute():
            local_path = (VIDEOS_DIR / input_source).resolve() if (VIDEOS_DIR / input_source).exists() else local_path.resolve()

        if not local_path.exists():
            return IngestionFailure(
                video_id=custom_video_id or local_path.stem,
                status="failed",
                failure_stage="ingestion",
                error=f"Local file does not exist: {str(local_path)}",
                fallback_action=None,
                source_type="upload",
                ingested_at=ingested_at
            ).model_dump()

        video_file = local_path
        raw_id = custom_video_id or local_path.stem
        video_id = re.sub(r'[\/:*?"<>|\r\n\t]', '_', raw_id).strip()
        if not video_id:
            video_id = f"upload_{uuid.uuid4().hex[:8]}"
        source_url = None

    # --- STEP 3: VALIDATE THE FILE ---
    val_metadata, val_failure = validate_video_file(
        file_path=video_file,
        video_id=video_id,
        source_type=source_type,
        source_url=source_url
    )
    if val_failure:
        val_failure["ingested_at"] = ingested_at
        _save_output(video_id, val_failure)
        return val_failure

    duration = val_metadata["duration"]
    size_bytes = val_metadata["size_bytes"]
    audio_present = val_metadata["audio_present"]

    # --- STEP 4: SIZE/DURATION CHECK FOR DIRECT VIDEO PROCESSING ---
    payload, proc_err = prepare_video_payload(
        file_path=video_file,
        duration=duration,
        size_bytes=size_bytes,
        video_id=video_id,
        audio_present=audio_present
    )

    # --- STEP 5: EXTRACT STRUCTURED DATA ---
    extraction, ext_failure = extract_structured_data(
        payload=payload,
        video_id=video_id,
        source_type=source_type,
        source_url=source_url
    )
    if ext_failure:
        ext_failure["ingested_at"] = ingested_at
        _save_output(video_id, ext_failure)
        return ext_failure

    # --- STEP 6: ATTACH METADATA AND RETURN ---
    success_record = IngestionSuccess(
        video_id=video_id,
        status="success",
        source_type=source_type,
        source_url=source_url,
        local_file_path=str(video_file),
        ingested_at=ingested_at,
        audio_present=audio_present,
        duration_seconds=round(duration, 2),
        processing_mode=payload.mode,
        category=extraction.category,
        place=extraction.place,
        city=extraction.city,
        country=extraction.country,
        cuisine=extraction.cuisine,
        foods=extraction.foods,
        destination=extraction.destination,
        activity_name=extraction.activity_name,
        product_name=extraction.product_name,
        tip_summary=extraction.tip_summary,
        objects=extraction.objects,
        transcript=extraction.transcript,
        ocr_text=extraction.ocr_text,
        summary=extraction.summary,
        tags=extraction.tags
    ).model_dump()

    _save_output(video_id, success_record)
    return success_record

def _save_output(video_id: str, record: dict) -> None:
    """Save record to outputs directory."""
    try:
        out_path = OUTPUTS_DIR / f"{video_id}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)
    except Exception:
        pass
