import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCheckCircle, FiClock, FiHash, FiShoppingBag } from "react-icons/fi";
import AppLayout from "../../components/layout/AppLayout";
import { getMyOrderById } from "../../api/orderApi";

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(8);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order) return undefined;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/student/order/${orderId}`, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order, orderId, navigate]);

  const loadOrder = async () => {
    try {
      const res = await getMyOrderById(orderId);
      setOrder(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load payment confirmation.");
    } finally {
      setIsLoading(false);
    }
  };

  const billItems = useMemo(() => {
    if (!order?.items) return [];
    return order.items.map((orderItem) => {
      const name = orderItem.itemName || orderItem.item?.name || "Menu Item";
      const unitPrice = orderItem.unitPrice || orderItem.item?.price || 0;
      const quantity = orderItem.quantity || 1;
      const lineTotal = orderItem.lineTotal || unitPrice * quantity;

      return {
        id: `${name}-${quantity}-${lineTotal}`,
        name,
        unitPrice,
        quantity,
        lineTotal,
      };
    });
  }, [order]);

  return (
    <AppLayout showCartBar={false}>
      <div className="mx-auto max-w-3xl py-5 text-white sm:py-7">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
            Fetching payment confirmation...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="mt-0.5 text-green-300" size={24} />
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl">Payment Confirmed</h1>
                  <p className="mt-1 text-sm text-green-100/90 sm:text-base">
                    Your order is placed successfully and sent to the kitchen.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm sm:grid-cols-2">
                <MetaRow icon={FiHash} label="Order Number" value={order.orderNumber} />
                <MetaRow icon={FiShoppingBag} label="Shop" value={order.shop?.name || "Assigned Shop"} />
                <MetaRow icon={FiHash} label="Transaction ID" value={order.payment?.transactionId || "N/A"} />
                <MetaRow
                  icon={FiClock}
                  label="Paid At"
                  value={order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString() : "Now"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <h2 className="text-lg font-bold sm:text-xl">Bill Summary</h2>

              <div className="mt-4 space-y-2 text-sm">
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
                    <div className="min-w-0 pr-3">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        Rs {item.unitPrice} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-orange-400">Rs {item.lineTotal}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-700 pt-4 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>Rs {order.subtotalAmount || 0}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Convenience Fee</span>
                  <span>Rs {order.convenienceFeeAmount || 0}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total Paid</span>
                  <span>Rs {order.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300 sm:flex sm:items-center sm:justify-between">
              <p>
                Redirecting to live preparation timeline in{" "}
                <span className="font-bold text-orange-400">{secondsLeft}s</span>
              </p>
              <button
                onClick={() => navigate(`/student/order/${orderId}`, { replace: true })}
                className="mt-3 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-slate-950 sm:mt-0"
              >
                Track Order Now
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-950 px-3 py-2">
      <Icon className="mt-0.5 text-orange-300" size={15} />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
