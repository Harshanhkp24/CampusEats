import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getVendorOrderBoard, updateOrderStatus } from "../../api/orderApi";
import { subscribeToShopEvents } from "../../api/streamApi";

const actionByStatus = {
  ACCEPTED: { type: "next", label: "Start Preparing", className: "bg-orange-500" },
  PREPARING: { type: "next", label: "Mark Ready", className: "bg-orange-500" },
};

const nextStatusByCurrent = {
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
};

export default function KitchenDisplay() {
  const [liveOrders, setLiveOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    loadKitchenBoard();

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) return;

      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        loadKitchenBoard();
      }, 250);
    };

    const unsubscribe = subscribeToShopEvents({
      onEvent: (event) => {
        if (event?.type === "order.created") {
          audioRef.current?.play?.().catch(() => {});
        }
        scheduleRefresh();
      },
      onError: () => {},
    });

    const fallbackInterval = setInterval(loadKitchenBoard, 45000);

    return () => {
      clearInterval(fallbackInterval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, []);

  const loadKitchenBoard = async () => {
    try {
      const res = await getVendorOrderBoard();
      setLiveOrders(res.data?.liveOrders || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load kitchen orders.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderAction = async (order) => {
    const action = actionByStatus[order.status];
    if (!action) return;

    try {
      const nextStatus = nextStatusByCurrent[order.status];
      if (!nextStatus) return;
      await updateOrderStatus(order._id, nextStatus);

      await loadKitchenBoard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update order status.");
    }
  };

  return (
    <AppLayout>
      <div className="py-4 text-white sm:py-6">
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-4xl">Kitchen View</h1>
          <p className="mt-1 text-sm text-slate-400">
            Chef-facing live queue with real-time status controls.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
            Loading kitchen queue...
          </div>
        ) : liveOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
            No live orders in queue.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {liveOrders.map((order) => {
              const action = actionByStatus[order.status];

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-5"
                >
                  <p className="break-all text-base font-bold sm:text-xl">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-slate-400">{order.user?.name}</p>
                  <p className="mt-2 text-base font-bold text-orange-400 sm:text-lg">
                    Rs {order.totalAmount}
                  </p>

                  <div className="mt-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                    {order.status}
                  </div>

                  {action && (
                    <button
                      onClick={() => handleOrderAction(order)}
                      className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold ${action.className}`}
                    >
                      {action.label}
                    </button>
                  )}

                  {!action && order.status === "PLACED" && (
                    <p className="mt-4 text-xs text-amber-300">
                      Waiting for manager to accept/reject this order.
                    </p>
                  )}

                  {!action && order.status === "READY" && (
                    <p className="mt-4 text-xs text-cyan-300">
                      Ready for pickup. Manager will mark as picked up.
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
