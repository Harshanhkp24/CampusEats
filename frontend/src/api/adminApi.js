import API from "./axios";

export const getPlatformStats = () => API.get("/admin/platform-stats");
export const getVendors = () => API.get("/admin/vendors");
