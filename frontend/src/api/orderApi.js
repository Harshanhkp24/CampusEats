import API from "./axios";




export const createOrder = (orderData) =>
    API.post("/orders", orderData);

export const getMyOrders = () => API.get("/orders/my");
export const getMyOrderById = (orderId) => API.get(`/orders/my/${orderId}`);

export const getOrdersByShop = (shopId) =>
  API.get(shopId ? `/orders/shop/${shopId}` : "/orders/shop");
export const getVendorOrderBoard = (date) =>
  API.get("/orders/shop/board", {
    params: date ? { date } : {},
  });

export const acceptOrder = (orderId) =>
  API.patch(`/orders/${orderId}/accept`);

export const rejectOrder = (orderId) =>
  API.put(`/orders/${orderId}/reject`);

export const updateOrderStatus = (orderId, status) =>
  API.patch(`/orders/${orderId}/status`, { status });

export const getShopQueue = (shopId) =>
  API.get(shopId ? `/orders/queue/${shopId}` : "/orders/queue");
