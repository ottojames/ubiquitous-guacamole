const isDev = import.meta.env.DEV;
const explicit = (import.meta.env.VITE_API_BASE || "").trim().replace(/\/+$/, "");

export const API_BASE = explicit || (isDev ? "http://localhost:5174" : "");
