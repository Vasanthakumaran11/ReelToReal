import subprocess
from pathlib import Path
from typing import Tuple, List, Optional
from config import (
    get_tool_path,
    FRAMES_DIR,
    AUDIO_DIR,
    MAX_DIRECT_VIDEO_DURATION_SEC,
    MAX_DIRECT_VIDEO_SIZE_BYTES
)

class VideoProcessingPayload:
    def __init__(
        self,
        mode: str, # "direct_video" | "frame_extraction"
        video_path: Optional[Path] = None,
        frames: Optional[List[Path]] = None,
        audio_path: Optional[Path] = None
    ):
        self.mode = mode
        self.video_path = video_path
        self.frames = frames or []
        self.audio_path = audio_path

def prepare_video_payload(
    file_path: Path,
    duration: float,
    size_bytes: int,
    video_id: str,
    audio_present: bool = True
) -> Tuple[VideoProcessingPayload, Optional[str]]:
    """
    Evaluates file duration & size against multimodal model limits per Step 4.
    If within limits -> direct video mode.
    If over limits -> extracts scene frames (gt(scene,0.4)) and audio track.
    """
    within_limits = (
        duration <= MAX_DIRECT_VIDEO_DURATION_SEC and
        size_bytes <= MAX_DIRECT_VIDEO_SIZE_BYTES
    )

    if within_limits:
        return VideoProcessingPayload(
            mode="direct_video",
            video_path=file_path
        ), None

    # Over limits: Fall back to frame extraction and audio extraction
    ffmpeg_cmd = get_tool_path("ffmpeg")
    video_frames_dir = FRAMES_DIR / video_id
    video_frames_dir.mkdir(parents=True, exist_ok=True)
    frame_pattern = str(video_frames_dir / "frame_%03d.jpg")

    # 1. Scene detection frame extraction: select='gt(scene,0.4)'
    frame_cmd = [
        ffmpeg_cmd,
        "-y",
        "-i", str(file_path),
        "-vf", "select='gt(scene,0.4)'",
        "-vsync", "vfr",
        frame_pattern
    ]
    frame_res = subprocess.run(frame_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    extracted_frames = sorted(list(video_frames_dir.glob("frame_*.jpg")))

    # If scene detection yields very few frames (e.g. slow panning), sample at 1 fps
    if len(extracted_frames) == 0:
        fallback_frame_cmd = [
            ffmpeg_cmd,
            "-y",
            "-i", str(file_path),
            "-vf", "fps=1",
            frame_pattern
        ]
        subprocess.run(fallback_frame_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        extracted_frames = sorted(list(video_frames_dir.glob("frame_*.jpg")))

    # 2. Audio track extraction if audio is present
    audio_file = None
    if audio_present:
        audio_output = AUDIO_DIR / f"{video_id}.mp3"
        audio_cmd = [
            ffmpeg_cmd,
            "-y",
            "-i", str(file_path),
            "-vn",
            "-acodec", "libmp3lame",
            "-q:a", "4",
            str(audio_output)
        ]
        audio_res = subprocess.run(audio_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if audio_output.exists() and audio_output.stat().st_size > 0:
            audio_file = audio_output

    return VideoProcessingPayload(
        mode="frame_extraction",
        video_path=file_path,
        frames=extracted_frames,
        audio_path=audio_file
    ), None
