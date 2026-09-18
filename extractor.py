import json
import time
import shutil
import tempfile
from pathlib import Path
from typing import Tuple, Optional
from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL
from schema import ReelToRealExtraction, IngestionFailure
from processor import VideoProcessingPayload

EXTRACTION_SYSTEM_PROMPT = """You are the ReelToReal Multimodal Ingestion Specialist.
Analyze this short-form video (Reel / YouTube Short / TikTok) or frame set + audio track.
Your goal is to extract structured, actionable data about real-world experiences, travel spots, food & dining, activities, tips, and products.

EXTRACTION INSTRUCTIONS:
1. Grounding: Rely strictly on what is visible, spoken, or written on screen. Never invent or guess missing details.
2. Missing Fields: If a field is not present or cannot be determined with confidence, output null (for optional scalar fields) or [] (for lists).
3. Summary: Write a dense 2-3 sentence semantic summary capturing the core experience, location/venue, key recommendations, and vibe. This summary will be used directly for semantic search and vector embeddings.
4. OCR & Transcripts: Capture on-screen text (OCR) such as names, signs, and captions. Transcribe spoken speech/voiceover faithfully.
5. Actionability: Highlight actionable tips (e.g. reservation needs, best times, price, special dishes) in `tip_summary`.
"""

def extract_structured_data(
    payload: VideoProcessingPayload,
    video_id: str,
    source_type: str = "upload",
    source_url: Optional[str] = None
) -> Tuple[Optional[ReelToRealExtraction], Optional[dict]]:
    """
    Calls the multimodal model with structured JSON schema per Step 5.
    Retries ONCE if the call fails or outputs invalid JSON.
    Returns (ReelToRealExtraction, None) on success or (None, failure_dict) on failure.
    """
    if not GEMINI_API_KEY:
        failure = IngestionFailure(
            video_id=video_id,
            status="failed",
            failure_stage="extraction",
            error="GEMINI_API_KEY or GOOGLE_API_KEY environment variable is missing.",
            fallback_action=None,
            source_type=source_type,
            source_url=source_url,
        ).model_dump()
        return None, failure

    client = genai.Client(api_key=GEMINI_API_KEY)

    # Attempt twice (Initial + 1 Retry)
    last_error = ""
    for attempt in range(1, 3):
        uploaded_files_to_cleanup = []
        try:
            contents = []

            if payload.mode == "direct_video" and payload.video_path:
                # Direct video upload via Gemini Files API with ASCII-safe staging
                with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
                    tmp_path = Path(tmp_file.name)
                try:
                    shutil.copy2(payload.video_path, tmp_path)
                    video_file = client.files.upload(
                        file=str(tmp_path),
                        config=types.UploadFileConfig(mime_type="video/mp4")
                    )
                finally:
                    if tmp_path.exists():
                        try:
                            tmp_path.unlink()
                        except Exception:
                            pass

                uploaded_files_to_cleanup.append(video_file)

                # Wait for file processing if necessary
                while video_file.state.name == "PROCESSING":
                    time.sleep(1)
                    video_file = client.files.get(name=video_file.name)

                if video_file.state.name == "FAILED":
                    raise RuntimeError(f"Gemini Files API failed to process video: {video_file.error}")

                contents.append(video_file)

            elif payload.mode == "frame_extraction":
                # Add extracted frames as JPEG image parts (limit to top 30 keyframes to avoid context bloat)
                step_frames = payload.frames
                if len(step_frames) > 30:
                    step = len(step_frames) // 30
                    step_frames = step_frames[::step]

                for frame_path in step_frames:
                    contents.append(types.Part.from_bytes(
                        data=frame_path.read_bytes(),
                        mime_type="image/jpeg"
                    ))

                # Add extracted audio track if present
                if payload.audio_path and payload.audio_path.exists():
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                        tmp_audio_path = Path(tmp_audio.name)
                    try:
                        shutil.copy2(payload.audio_path, tmp_audio_path)
                        audio_file = client.files.upload(
                            file=str(tmp_audio_path),
                            config=types.UploadFileConfig(mime_type="audio/mp3")
                        )
                    finally:
                        if tmp_audio_path.exists():
                            try:
                                tmp_audio_path.unlink()
                            except Exception:
                                pass

                    uploaded_files_to_cleanup.append(audio_file)
                    contents.append(audio_file)

            # Add prompt
            contents.append(EXTRACTION_SYSTEM_PROMPT)

            # Call multimodal model with structured JSON output enforced at API level
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ReelToRealExtraction,
                temperature=0.2,
            )

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=config,
            )

            # Parse and validate response
            if response.text:
                parsed_data = ReelToRealExtraction.model_validate_json(response.text)
                return parsed_data, None
            else:
                raise ValueError("Model returned an empty response.")

        except Exception as e:
            last_error = str(e)
            if attempt == 1:
                time.sleep(2) # Backoff before single retry
                continue
            else:
                break
        finally:
            # Clean up uploaded files on Gemini servers
            for f in uploaded_files_to_cleanup:
                try:
                    client.files.delete(name=f.name)
                except Exception:
                    pass

    failure = IngestionFailure(
        video_id=video_id,
        status="failed",
        failure_stage="extraction",
        error=f"Extraction model call failed after 1 retry: {last_error}",
        fallback_action=None,
        source_type=source_type,
        source_url=source_url,
    ).model_dump()
    return None, failure
