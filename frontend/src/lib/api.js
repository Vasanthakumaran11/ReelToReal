/**
 * Dynamic API client for ReelToReal backend services.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || "";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jfkuuxqhckrzyyjvchwk.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Xjb9nicu9F7l7cj1oDFOXQ_5B45UbK7";

/**
 * Fetch all processed reels from the backend API, with direct Supabase REST fallback.
 */
export async function fetchReels() {
  try {
    const res = await fetch(`${BASE}/api/reels`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch reels from backend API, trying Supabase REST:", err.message);
  }

  // Direct Supabase REST fallback over HTTPS (port 443)
  try {
    const sRes = await fetch(`${SUPABASE_URL}/rest/v1/reels?select=*&order=ingested_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (sRes.ok) {
      const sData = await sRes.json();
      if (Array.isArray(sData) && sData.length > 0) {
        return sData.map((r) => ({ ...r, saved: true }));
      }
    }
  } catch (sErr) {
    console.warn("Could not fetch reels from Supabase REST:", sErr.message);
  }

  return [];
}

/**
 * Fetch all trip/activity plans from the backend API.
 */
export async function fetchPlans() {
  try {
    const res = await fetch(`${BASE}/api/plans`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn("Could not fetch plans from backend API:", err.message);
  }

  // Direct Supabase REST fallback
  try {
    const sRes = await fetch(`${SUPABASE_URL}/rest/v1/plans?select=*&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (sRes.ok) {
      const sData = await sRes.json();
      if (Array.isArray(sData)) return sData;
    }
  } catch (sErr) {
    console.warn("Could not fetch plans from Supabase REST:", sErr.message);
  }

  return [];
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
