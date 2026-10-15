export const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const API = import.meta.env.VITE_API_URL || "https://quizhub-2.vercel.app";
