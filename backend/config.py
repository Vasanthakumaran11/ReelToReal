import os
import shutil
from pathlib import Path
from dotenv import load_dotenv
# Workspace paths
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
BASE_DIR = ROOT_DIR

# Load environment from root .env and backend/.env
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")
load_dotenv()

VIDEOS_DIR = ROOT_DIR / "videos"
FRAMES_DIR = ROOT_DIR / "frames"
AUDIO_DIR = ROOT_DIR / "audio"
OUTPUTS_DIR = ROOT_DIR / "outputs"

for directory in (VIDEOS_DIR, FRAMES_DIR, AUDIO_DIR, OUTPUTS_DIR):
    directory.mkdir(parents=True, exist_ok=True)

# Multimodal limits for direct video processing (Step 4)
MAX_DIRECT_VIDEO_DURATION_SEC = float(os.getenv("MAX_DIRECT_VIDEO_DURATION_SEC", "180")) # 3 minutes
MAX_DIRECT_VIDEO_SIZE_BYTES = int(os.getenv("MAX_DIRECT_VIDEO_SIZE_MB", "50")) * 1024 * 1024 # 50 MB

# Model configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
_raw_model = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_MODEL = "gemini-3.1-flash-lite" if _raw_model in ("gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.6-flash") else _raw_model

def get_tool_path(name: str) -> str:
    """Find the path to yt-dlp, ffmpeg, or ffprobe with fallback search in common Windows Winget directories."""
    tool = shutil.which(name)
    if tool:
        return tool

    # Fallback to local winget install directories on Windows
    local_app_data = os.getenv("LOCALAPPDATA", "")
    if local_app_data:
        winget_pkgs = Path(local_app_data) / "Microsoft" / "WinGet" / "Packages"
        if winget_pkgs.exists():
            matches = list(winget_pkgs.glob(f"**/{name}.exe"))
            if matches:
                return str(matches[0])
    return name
