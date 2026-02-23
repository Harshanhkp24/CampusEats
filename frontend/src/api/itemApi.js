import API from "./axios";

export const getItemsByShop = (shopId) =>
  API.get(`/items/${shopId}`);

export const addItem = (data) => API.post("/items", data);

/*export const getItemsByShop = (shopId) =>
  API.get(`/items/shop/${shopId}`);*/