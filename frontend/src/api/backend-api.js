const API_URL = "http://localhost:8000/api/data";

/**
 * A wrapper around fetch that handles network errors gracefully.
 * 
 * @param {string} url  - The URL to fetch.
 * @param {object} opts - Fetch options.
 * @returns {Promise<Response>} The fetch response.
 */
async function safeFetch(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res;
  } catch (err) {
    console.warn("[BackendAPI] network error, falling back to localStorage:", err);
    throw err;
  }
}

/**
 * Load the full state from backend (fallback to localStorage).
 * 
 * @returns {Promise<object>} A plain object.
 */
export async function loadFromBackend() {
  try {
    const res = await safeFetch(API_URL);
    return await res.json();
  } catch (_) {
    return JSON.parse(localStorage.getItem("digitalWife") || "{}");
  }
}

/**
 * Save the full state to backend (fallback to localStorage).
 * 
 * @param {object} state - The full state object to save.
 * @return {void}
 */
export async function saveToBackend(state) {
  try {
    await safeFetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    // Also mirror locally
    localStorage.setItem("digitalWife", JSON.stringify(state));
  } catch (_) {
    localStorage.setItem("digitalWife", JSON.stringify(state));
  }
}

/**
 * Patch a single field in backend (fallback to localStorage). Uses backend PATCH /api/data/{field} which performs upsert.
 * 
 * @param {string} field - The field name to update.
 * @param {any} value    - The new value for the field.
 * @returns {void}
 */
export async function updateField(field, value) {
  try {
    await safeFetch(`${API_URL}/${encodeURIComponent(field)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    // Mirror locally
    const state = JSON.parse(localStorage.getItem("digitalWife") || "{}");
    state[field] = value;
    localStorage.setItem("digitalWife", JSON.stringify(state));
  } catch (_) {
    const state = JSON.parse(localStorage.getItem("digitalWife") || "{}");
    state[field] = value;
    localStorage.setItem("digitalWife", JSON.stringify(state));
  }
}

/**
 * Get a single field from backend (fallback to localStorage).
 * 
 * @param {string} field - The field name to retrieve.
 * @returns {Promise<any>} The field value, or undefined if not found.
 */
export async function getField(field) {
  const state = await loadFromBackend();
  return state ? state[field] : undefined;
}

/**
 * Convenience: sync provided keys from localStorage to backend.
 * 
 * @param {Array<string>} keys - List of keys to sync.
 */
export async function syncLocalToBackend(keys = []) {
  try {
    const local = JSON.parse(localStorage.getItem("digitalWife") || "{}");
    const payload = {};
    keys.forEach(k => {
      if (local[k] !== undefined) payload[k] = local[k];
    });
    if (Object.keys(payload).length) await saveToBackend(payload);
  } catch (err) {
    console.warn("[BackendAPI] failed to sync local to backend:", err);
  }
}
