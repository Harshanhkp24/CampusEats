import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyOrderById, getMyOrders } from "../../api/orderApi";
import AppLayout from "../../components/layout/AppLayout";

const timelineSteps = [
  {
    key: "PLACED",
    title: "Order Placed",
    hint: "Payment confirmed. Order received by the restaurant.",
  },
  {
    key: "ACCEPTED",
    title: "Accepted",
    hint: "Vendor accepted your order.",
  },
  {
    key: "PREPARING",
    title: "Preparing",
    hint: "Your food is being prepared.",
  },
  {
    key: "READY",
    title: "Ready for Pickup",
    hint: "Collect from counter using your order number.",
  },
  {
    key: "COMPLETED",
    title: "Picked Up",
    hint: "Order completed successfully.",
  },
];

const statusMeta = {
  PLACED: "We have sent your order to the kitchen.",
  ACCEPTED: "Kitchen team has accepted and queued your order.",
  PREPARING: "Food is currently being prepared.",
  READY: "Your order is ready. Please pick it up from the shop.",
  COMPLETED: "Order picked up. Enjoy your meal!",
  REJECTED: "Order was rejected by the vendor. Payment will be handled as per policy.",
};

const getStatusIndex = (status) => timelineSteps.findIndex((step) => step.key === status);

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadOrders = async () => {
    try {
      if (id) {
        const res = await getMyOrderById(id);
        setOrders([res.data]);
      } else {
        const res = await getMyOrders();
        setOrders(res.data);
      }
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load order status.");
      setOrders([]);
    }
  };

  const visibleOrders = id
    ? orders.filter((order) => order._id === id)
    : orders;

  return (
    <AppLayout showCartBar={false}>
      <div className="mx-auto max-w-4xl py-4 text-white sm:py-6">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Live Preparation Timeline</h1>
        <p className="mb-6 text-sm text-slate-400 sm:text-base">
          Real-time updates every 5 seconds.
        </p>

        {error && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {error}
          </p>
        )}

        {id && visibleOrders.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-4 text-slate-300">This order is not available right now.</p>
            <button
              onClick={() => navigate("/student/orders")}
              className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-slate-950"
            >
              Go to My Orders
            </button>
          </div>
        )}

        {visibleOrders.map((order) => (
          <TimelineCard key={order._id} order={order} />
        ))}
      </div>
    </AppLayout>
  );
}

function TimelineCard({ order }) {
  const statusIndex = getStatusIndex(order.status);
  const isRejected = order.status === "REJECTED";
  const progressPercent = isRejected
    ? 25
    : statusIndex <= 0
      ? 5
      : Math.min(100, Math.round((statusIndex / (timelineSteps.length - 1)) * 100));

  const statusEvents = useMemo(() => {
    if (!Array.isArray(order.statusHistory)) return [];
    return [...order.statusHistory]
      .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))
      .map((event) => ({
        key: `${event.status}-${event.changedAt}`,
        status: event.status,
        at: new Date(event.changedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        note: event.note || statusMeta[event.status] || event.status,
      }));
  }, [order.statusHistory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="break-all text-sm font-bold text-slate-100 sm:text-lg">
            {order.orderNumber}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Shop: {order.shop?.name || "Assigned Shop"}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            order.status === "COMPLETED"
              ? "bg-green-500/20 text-green-300"
              : order.status === "REJECTED"
                ? "bg-red-500/20 text-red-300"
                : "bg-orange-500/20 text-orange-300"
          }`}
        >
          {order.status}
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-300">{statusMeta[order.status]}</p>

      {!isRejected && (
        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {timelineSteps.map((step, index) => {
              const isActive = statusIndex >= index;
              const isCurrent = order.status === step.key;

              return (
                <div key={step.key} className="rounded-lg bg-slate-950 p-3">
                  <div
                    className={`mb-2 h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-green-400" : "bg-slate-600"
                    }`}
                  />
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent ? "text-orange-300" : "text-slate-200"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{step.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {statusEvents.length > 0 && (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm font-semibold text-slate-200">Status Event Log</p>
          <div className="mt-3 space-y-2">
            {statusEvents.map((event) => (
              <div
                key={event.key}
                className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-slate-200">
                  <span className="font-semibold">{event.status}</span> - {event.note}
                </p>
                <p className="text-slate-400">{event.at}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-sm font-bold text-orange-400">Total Paid: Rs {order.totalAmount}</p>
    </motion.div>
  );
}
