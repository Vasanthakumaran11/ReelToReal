/**
 * Dynamic API client for ReelToReal backend services.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function askReelToReal(query, history = []) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  return data;
}

/**
 * Fetch all processed reels from the backend API.
 */
export async function fetchReels() {
  try {
    const res = await fetch(`${BASE}/api/reels`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Could not fetch reels from backend API:", err.message);
    return [];
  }
}

/**
 * Fetch all trip/activity plans from the backend API.
 */
export async function fetchPlans() {
  try {
    const res = await fetch(`${BASE}/api/plans`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Could not fetch plans from backend API:", err.message);
    return [];
  }
}

/**
 * Request an AI plan from a prompt or question.
 */
export async function craftPlan(question) {
  const res = await fetch(`${BASE}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}: Failed to craft plan`);
  }
  return await res.json();
}

/**
 * Trigger ingestion for a web video URL (Instagram, YouTube, TikTok).
 */
export async function ingestUrl(source_url) {
  try {
    const res = await fetch(`${BASE}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_url }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      return {
        video_id: `url_${Date.now()}`,
        status: "failed",
        failure_stage: "ingestion",
        error: "Backend API is not running on port 8000. Please start the backend server to ingest live URLs.",
        fallback_action: "request_direct_upload",
      };
    }
    return {
      status: "failed",
      error: err.message || "Failed to ingest URL",
    };
  }
}

/**
 * Trigger ingestion for an uploaded video file.
 */
export async function ingestFile(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE}/api/ingest/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      return {
        video_id: `upload_${Date.now()}`,
        status: "failed",
        failure_stage: "ingestion",
        error: "Backend API is not running on port 8000. Start backend to process uploaded files.",
      };
    }
    return {
      status: "failed",
      error: err.message || "Failed to upload and process video",
    };
  }
}
