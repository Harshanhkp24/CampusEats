import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { acceptOrder, getVendorOrderBoard, rejectOrder, updateOrderStatus } from "../../api/orderApi";
import { subscribeToShopEvents } from "../../api/streamApi";

const getLocalDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Orders() {
  const navigate = useNavigate();
  const [board, setBoard] = useState({
    liveOrders: [],
    previousOrders: [],
    summary: {
      liveCount: 0,
      completedCount: 0,
      rejectedCount: 0,
    },
  });
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const refreshTimeoutRef = useRef(null);
  const isShopOpen = board?.shop?.isOpen !== false;

  useEffect(() => {
    loadBoard(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) return;

      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        loadBoard(selectedDate);
      }, 250);
    };

    const unsubscribe = subscribeToShopEvents({
      onEvent: (event) => {
        if (event?.type === "order.created") {
          setStatusMessage("New order received.");
        }
        scheduleRefresh();
      },
      onError: () => {},
    });

    const fallbackInterval = setInterval(() => loadBoard(selectedDate), 45000);

    return () => {
      clearInterval(fallbackInterval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [selectedDate]);

  const loadBoard = async (date) => {
    try {
      const res = await getVendorOrderBoard(date);
      setBoard(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    if (!isShopOpen) {
      setError("Shop is closed. Open the shop before accepting or rejecting orders.");
      return;
    }

    try {
      await acceptOrder(orderId);
      setStatusMessage("Order accepted.");
      await loadBoard(selectedDate);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to accept order.");
    }
  };

  const handleReject = async (orderId) => {
    if (!isShopOpen) {
      setError("Shop is closed. Open the shop before accepting or rejecting orders.");
      return;
    }

    try {
      await rejectOrder(orderId);
      setStatusMessage("Order rejected.");
      await loadBoard(selectedDate);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reject order.");
    }
  };

  const handlePickup = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "COMPLETED");
      setStatusMessage("Order marked as picked up.");
      await loadBoard(selectedDate);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to mark picked up.");
    }
  };

  return (
    <AppLayout>
      <div className="py-4 text-white sm:py-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Order Board</h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Manager controls: Accept/Reject and mark pickup. Kitchen handles preparation stages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm">
              <span className="text-slate-400">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md bg-slate-800 px-2 py-1 text-slate-100 outline-none"
              />
            </label>

            <button
              onClick={() => navigate("/vendor/kitchen")}
              className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:brightness-105 sm:text-sm"
            >
              Open Kitchen View
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {error}
          </p>
        )}

        {statusMessage && (
          <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            {statusMessage}
          </p>
        )}

        {!isShopOpen && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Shop is currently closed. Accept/Reject is disabled. Open shop from Manager view first.
          </p>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="Active Live Orders" value={board.summary?.liveCount || 0} />
          <SummaryCard label="Completed (Selected Date)" value={board.summary?.completedCount || 0} />
          <SummaryCard label="Rejected (Selected Date)" value={board.summary?.rejectedCount || 0} />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold sm:text-xl">Live Queue</h2>
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading live orders...</p>
          ) : board.liveOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
              No live orders in queue right now.
            </div>
          ) : (
            <div className="space-y-3">
              {board.liveOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold sm:text-base">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400 sm:text-sm">{order.user?.name}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Amount: <span className="font-semibold text-orange-400">Rs {order.totalAmount}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    Payment: {order.payment?.status || "PAID"}
                  </p>

                  {order.items?.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Ordered Items
                      </p>
                      <div className="mt-2 space-y-1.5 text-xs text-slate-300 sm:text-sm">
                        {order.items.map((line, index) => {
                          const itemName = line.itemName || line.item?.name || "Item";
                          const qty = Number(line.quantity) || 1;
                          const lineTotal = Number(line.lineTotal) || qty * (Number(line.unitPrice) || Number(line.item?.price) || 0);

                          return (
                            <div
                              key={`${order._id}-item-${line.item?._id || line.item || index}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="truncate">
                                {itemName} x{qty}
                              </span>
                              <span className="shrink-0 text-slate-400">Rs {lineTotal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {order.status === "PLACED" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAccept(order._id)}
                        disabled={!isShopOpen}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(order._id)}
                        disabled={!isShopOpen}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {order.status === "READY" && (
                    <div className="mt-3">
                      <button
                        onClick={() => handlePickup(order._id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Mark Picked Up
                      </button>
                    </div>
                  )}

                  {["ACCEPTED", "PREPARING"].includes(order.status) && (
                    <p className="mt-3 text-xs text-cyan-300">
                      Kitchen team is handling this stage.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold sm:text-xl">Previous Orders (Selected Date)</h2>
          {board.previousOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
              No completed or rejected orders for this date.
            </div>
          ) : (
            <div className="space-y-3">
              {board.previousOrders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold sm:text-base">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400 sm:text-sm">{order.user?.name}</p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">
                    Amount: <span className="font-semibold text-orange-400">Rs {order.totalAmount}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    Payment: {order.payment?.status || "PAID"} | Closed at:{" "}
                    {new Date(order.completedAt || order.updatedAt).toLocaleString()}
                  </p>

                  {order.items?.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Ordered Items
                      </p>
                      <div className="mt-2 space-y-1.5 text-xs text-slate-300 sm:text-sm">
                        {order.items.map((line, index) => {
                          const itemName = line.itemName || line.item?.name || "Item";
                          const qty = Number(line.quantity) || 1;
                          const lineTotal = Number(line.lineTotal) || qty * (Number(line.unitPrice) || Number(line.item?.price) || 0);

                          return (
                            <div
                              key={`${order._id}-prev-item-${line.item?._id || line.item || index}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="truncate">
                                {itemName} x{qty}
                              </span>
                              <span className="shrink-0 text-slate-400">Rs {lineTotal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-1 text-lg font-bold sm:text-2xl">{value}</p>
    </div>
  );
}
