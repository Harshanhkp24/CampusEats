import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOrder } from "../../api/orderApi";
import { useCart } from "../../context/CartContext";
import AppLayout from "../../components/layout/AppLayout";
import { getShopById } from "../../api/shopApi";

const generateTransactionId = () =>
  `TXN-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartShop, clearCart } = useCart();

  const [upiId, setUpiId] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isCheckingShop, setIsCheckingShop] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [cartItems],
  );
  const convenienceFee = subtotal > 0 ? 5 : 0;
  const computedTotal = subtotal + convenienceFee;

  const total = location.state?.total || computedTotal;
  const shopId = location.state?.shopId || cartShop;

  useEffect(() => {
    if (!cartItems || cartItems.length === 0 || !shopId) {
      navigate("/student/home", { replace: true });
    }
  }, [cartItems, shopId, navigate]);

  useEffect(() => {
    let ignore = false;

    const loadShopStatus = async () => {
      if (!shopId) return;

      setIsCheckingShop(true);
      try {
        const res = await getShopById(shopId);
        if (ignore) return;

        const open = Boolean(res.data?.isOpen);
        setIsShopOpen(open);
        if (!open) {
          setError(`${res.data?.name || "This shop"} is currently closed. Payment is disabled.`);
        }
      } catch (err) {
        if (ignore) return;
        setIsShopOpen(false);
        setError(err?.response?.data?.message || "Unable to verify shop status.");
      } finally {
        if (!ignore) {
          setIsCheckingShop(false);
        }
      }
    };

    loadShopStatus();

    return () => {
      ignore = true;
    };
  }, [shopId]);

  const handlePayment = async () => {
    if (isPaying) return;
    if (isCheckingShop) return;
    if (!isShopOpen) {
      setError("Shop is closed. Payment cannot continue.");
      return;
    }
    if (!upiId.trim()) {
      setError("Please enter your UPI ID to continue.");
      return;
    }

    setIsPaying(true);
    setError("");

    try {
      const payload = {
        shopId,
        paymentMethod: "UPI",
        transactionId: generateTransactionId(),
        items: cartItems.map((item) => ({
          item: item._id,
          quantity: item.qty,
        })),
      };

      const res = await createOrder(payload);
      clearCart();
      navigate(`/student/payment/confirmation/${res.data._id}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <AppLayout showCartBar={false}>
      <div className="mx-auto flex max-w-3xl justify-center py-6 text-white">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h1 className="text-xl font-bold text-center sm:text-2xl">UPI Payment</h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Complete secure payment to place your order.
          </p>

          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">UPI ID</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
            />
          </div>

          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>Rs {subtotal}</span>
            </div>
            <div className="mt-2 flex justify-between text-slate-300">
              <span>Convenience Fee</span>
              <span>Rs {convenienceFee}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-base font-bold">
              <span>Total</span>
              <span>Rs {total}</span>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            onClick={handlePayment}
            disabled={isPaying || isCheckingShop || !isShopOpen}
            className="mt-5 w-full rounded-xl bg-green-600 py-3 text-sm font-bold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
          >
            {isCheckingShop ? "Checking Shop Status..." : isPaying ? "Processing Payment..." : "Pay Now"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
