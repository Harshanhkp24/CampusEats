import API from "./axios";

export const getAllShops = () => API.get("/shops");
export const getShopById = (shopId) => API.get(`/shops/${shopId}`);

export const createShop = (payload) => API.post("/shops", payload);
export const assignVendorToShop = (shopId, ownerId) =>
  API.put(`/shops/${shopId}/assign-vendor`, { ownerId });
export const openShop = (shopId) => API.put(`/shops/${shopId}/open`);
export const closeShop = (shopId) => API.put(`/shops/${shopId}/close`);
