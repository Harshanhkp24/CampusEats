import { useEffect, useState } from "react";
import { getOrdersByShop } from "../../api/orderApi";
import AppLayout from "../../components/layout/AppLayout";

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrdersByShop();
      setOrders(res.data.filter((order) => order.status !== "COMPLETED"));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AppLayout showCartBar={false}>
      <div className="py-4 sm:py-6 text-white">
        <h1 className="text-2xl sm:text-4xl font-bold mb-8 text-center">
          Kitchen Live Orders
        </h1>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-xl"
            >
              <h2 className="text-lg sm:text-2xl font-bold mb-2 break-all">{order.orderNumber}</h2>
              <p className="text-gray-400 text-sm sm:text-base">{order.user?.name}</p>

              <p className="mt-3 text-orange-400 font-bold text-base sm:text-xl">
                Rs {order.totalAmount}
              </p>

              <div className="mt-4 text-sm sm:text-lg font-bold">
                Status: {order.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
