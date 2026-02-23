import { useEffect, useRef, useState } from "react";
import { acceptOrder, getOrdersByShop, updateOrderStatus } from "../../api/orderApi";
import AppLayout from "../../components/layout/AppLayout";

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const prevOrdersRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrdersByShop();

      if (
        prevOrdersRef.current.length > 0 &&
        res.data.length > prevOrdersRef.current.length
      ) {
        audioRef.current?.play();
        alert("New Order Received!");
      }

      prevOrdersRef.current = res.data;
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAccept = async (id) => {
    await acceptOrder(id);
    loadOrders();
  };

  const handleNextStatus = async (order) => {
    const nextMap = {
      ACCEPTED: "PREPARING",
      PREPARING: "READY",
      READY: "COMPLETED",
    };

    const next = nextMap[order.status];
    if (!next) return;

    await updateOrderStatus(order._id, next);
    loadOrders();
  };

  return (
    <AppLayout showCartBar={false}>
      <div className="py-4 sm:py-6 text-white">
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Live Orders</h1>

        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-gray-900 p-4 sm:p-5 rounded-xl mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
          >
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-lg break-all">{order.orderNumber}</p>
              <p className="text-gray-400 text-sm sm:text-base">{order.user?.name}</p>
              <p className="text-orange-400 font-bold mt-1 text-sm sm:text-base">Rs {order.totalAmount}</p>
              <p className="mt-1 text-sm sm:text-base">Status: {order.status}</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {order.status === "PLACED" && (
                <button
                  onClick={() => handleAccept(order._id)}
                  className="bg-green-600 px-4 py-2 rounded-xl font-bold text-sm sm:text-base w-full sm:w-auto"
                >
                  Accept
                </button>
              )}

              {["ACCEPTED", "PREPARING", "READY"].includes(order.status) && (
                <button
                  onClick={() => handleNextStatus(order)}
                  className="bg-orange-500 px-4 py-2 rounded-xl font-bold text-sm sm:text-base w-full sm:w-auto"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
