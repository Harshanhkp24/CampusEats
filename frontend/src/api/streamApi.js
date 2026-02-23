const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const subscribeToShopEvents = ({ shopId, onEvent, onError } = {}) => {
  const token = sessionStorage.getItem("token");
  const params = new URLSearchParams();

  if (token) {
    params.set("token", token);
  }

  if (shopId) {
    params.set("shopId", shopId);
  }

  const eventSource = new EventSource(`${API_BASE_URL}/orders/stream?${params.toString()}`);

  eventSource.addEventListener("shop-event", (event) => {
    try {
      const payload = JSON.parse(event.data);
      onEvent?.(payload);
    } catch (error) {
      onError?.(error);
    }
  });

  eventSource.onerror = (error) => {
    onError?.(error);
  };

  return () => {
    eventSource.close();
  };
};
