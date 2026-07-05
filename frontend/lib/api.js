/**
 * Thin wrapper around fetch for talking to the FastAPI backend.
 * Set NEXT_PUBLIC_API_URL in .env.local (see .env.local.example).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Builds a query string from a filters object, dropping empty values.
 * List-type filters (arrays) get repeated as multiple query params,
 * matching how FastAPI expects `topic=gas&topic=oil` for a List[str] param.
 */
function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function get(path, filters) {
  const res = await fetch(`${API_URL}${path}${buildQuery(filters)}`);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getFilters: () => get("/api/filters"),
  getInsights: (filters) => get("/api/insights", filters),
  getByYear: (filters) => get("/api/aggregate/by-year", filters),
  getByCountry: (filters) => get("/api/aggregate/by-country", filters),
  getByTopic: (filters) => get("/api/aggregate/by-topic", filters),
  getByRegion: (filters) => get("/api/aggregate/by-region", filters),
};