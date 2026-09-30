export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getAuthHeaders = (token, extraHeaders = {}) => ({
  "Content-Type": "application/json",
  ...extraHeaders,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});
