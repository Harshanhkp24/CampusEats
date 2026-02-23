import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import AppLayout from "../../components/layout/AppLayout";
import { getShopById } from "../../api/shopApi";

export default function Cart() {
  const { cartItems, addToCart, removeFromCart, cartShop } = useCart();
  const navigate = useNavigate();
  const [isCheckingShop, setIsCheckingShop] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [shopStatusMessage, setShopStatusMessage] = useState("");

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/student/home", { replace: true });
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    let ignore = false;

    const loadShopStatus = async () => {
      if (!cartShop) return;

      setIsCheckingShop(true);
      try {
        const res = await getShopById(cartShop);
        if (ignore) return;

        const open = Boolean(res.data?.isOpen);
        setIsShopOpen(open);
        setShopStatusMessage(
          open
            ? ""
            : `${res.data?.name || "This shop"} is currently closed. Checkout is disabled.`,
        );
      } catch (err) {
        if (ignore) return;
        setIsShopOpen(false);
        setShopStatusMessage(
          err?.response?.data?.message || "Unable to verify shop status right now.",
        );
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
  }, [cartShop]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const fee = subtotal > 0 ? 5 : 0;
  const total = subtotal + fee;

  const placeOrder = () => {
    if (!isShopOpen) {
      setShopStatusMessage("Shop is closed. Open shop is required before payment.");
      return;
    }

    navigate("/student/payment", {
      state: {
        total,
        shopId: cartShop,
      },
    });
  };

  return (
    <AppLayout showCartBar={false}>
      <div className="py-4 sm:py-6 text-white max-w-2xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">Your Order</h1>

        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="bg-gray-900 rounded-xl p-3 sm:p-4 flex justify-between items-center gap-3"
            >
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base truncate">{item.name}</h3>
                <p className="text-gray-400 text-sm sm:text-base">Rs {item.price}</p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="bg-gray-700 px-2.5 sm:px-3 py-1 rounded"
                >
                  -
                </button>

                <span className="text-sm sm:text-base">{item.qty}</span>

                <button
                  onClick={() => addToCart(item, cartShop)}
                  className="bg-gray-700 px-2.5 sm:px-3 py-1 rounded"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 mt-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs {subtotal}</span>
          </div>

          <div className="flex justify-between mt-2">
            <span>Convenience Fee</span>
            <span>Rs {fee}</span>
          </div>

          <div className="flex justify-between mt-4 font-bold text-lg">
            <span>Total</span>
            <span>Rs {total}</span>
          </div>

          {shopStatusMessage && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {shopStatusMessage}
            </p>
          )}

          <button
            onClick={placeOrder}
            disabled={isCheckingShop || !isShopOpen}
            className="w-full mt-6 rounded-xl bg-orange-500 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 sm:text-base"
          >
            {isCheckingShop ? "Checking Shop Status..." : "Proceed to Pay"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
