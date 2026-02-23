const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveMediaUrl = (mediaPath) => {
  if (!mediaPath) return "";

  if (/^https?:\/\//i.test(mediaPath)) {
    return mediaPath;
  }

  if (mediaPath.startsWith("/")) {
    return `${API_ORIGIN}${mediaPath}`;
  }

  return `${API_ORIGIN}/${mediaPath}`;
};
