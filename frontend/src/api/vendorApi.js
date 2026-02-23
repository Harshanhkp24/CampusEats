import API from "./axios";

export const getVendorStats = () => API.get("/vendor/stats");
export const getVendorManagerOverview = (date) =>
  API.get("/vendor/manager/overview", {
    params: date ? { date } : {},
  });
export const setVendorShopStatus = (isOpen) =>
  API.patch("/vendor/manager/shop-status", { isOpen });
export const uploadVendorShopPoster = (formData) =>
  API.post("/vendor/manager/poster", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const getChefAccounts = () => API.get("/vendor/manager/chefs");
export const createChefAccount = (payload) => API.post("/vendor/manager/chefs", payload);
