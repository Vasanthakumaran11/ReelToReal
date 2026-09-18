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

def extract_video_frames(file_path: Path, video_id: str, fps: Optional[float] = None) -> List[Path]:
    """Extracts frames from the video into frames/{video_id}/."""
    ffmpeg_cmd = get_tool_path("ffmpeg")
    video_frames_dir = FRAMES_DIR / video_id
    video_frames_dir.mkdir(parents=True, exist_ok=True)
    frame_pattern = str(video_frames_dir / "frame_%03d.jpg")

    if fps:
        cmd = [
            ffmpeg_cmd,
            "-y",
            "-i", str(file_path),
            "-vf", f"fps={fps}",
            frame_pattern
        ]
    else:
        # Scene detection with fallback to 1 fps if few scene changes are detected
        cmd = [
            ffmpeg_cmd,
            "-y",
            "-i", str(file_path),
            "-vf", "select='gt(scene,0.4)'",
            "-vsync", "vfr",
            frame_pattern
        ]

    subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    extracted_frames = sorted(list(video_frames_dir.glob("frame_*.jpg")))

    # Fallback if scene detection produced fewer than 5 frames
    if not fps and len(extracted_frames) < 5:
        fallback_cmd = [
            ffmpeg_cmd,
            "-y",
            "-i", str(file_path),
            "-vf", "fps=1",
            frame_pattern
        ]
        subprocess.run(fallback_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        extracted_frames = sorted(list(video_frames_dir.glob("frame_*.jpg")))

    return extracted_frames

def extract_audio_track(file_path: Path, video_id: str) -> Optional[Path]:
    """Extracts audio track from the video into audio/{video_id}.mp3."""
    ffmpeg_cmd = get_tool_path("ffmpeg")
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
    subprocess.run(audio_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if audio_output.exists() and audio_output.stat().st_size > 0:
        return audio_output
    return None

def prepare_video_payload(
    file_path: Path,
    duration: float,
    size_bytes: int,
    video_id: str,
    audio_present: bool = True,
    save_disk_artifacts: bool = True
) -> Tuple[VideoProcessingPayload, Optional[str]]:
    """
    Evaluates file duration & size against multimodal model limits per Step 4.
    Also ensures frame images and audio track are saved to disk in frames/ and audio/.
    """
    within_limits = (
        duration <= MAX_DIRECT_VIDEO_DURATION_SEC and
        size_bytes <= MAX_DIRECT_VIDEO_SIZE_BYTES
    )

    extracted_frames = []
    extracted_audio = None

    if save_disk_artifacts or not within_limits:
        extracted_frames = extract_video_frames(file_path, video_id)
        if audio_present:
            extracted_audio = extract_audio_track(file_path, video_id)

    if within_limits:
        return VideoProcessingPayload(
            mode="direct_video",
            video_path=file_path,
            frames=extracted_frames,
            audio_path=extracted_audio
        ), None

    return VideoProcessingPayload(
        mode="frame_extraction",
        video_path=file_path,
        frames=extracted_frames,
        audio_path=extracted_audio
    ), None
