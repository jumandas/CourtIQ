/**
 * CourtIQ Analytics - Axios API client
 * Author: Juman Das (Frontend Lead)
 *
 * All API calls go through this instance. The baseURL is picked up from
 * VITE_API_URL env var (set in production) or falls back to /api (dev proxy).
 */
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

export default client;
