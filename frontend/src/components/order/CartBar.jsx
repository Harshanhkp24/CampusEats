import { motion } from "framer-motion";
import { FiShoppingCart } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function CartBar() {
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  if (cartItems.length === 0) return null;

  return (
    <div className="fixed bottom-3 left-1/2 z-30 w-[92%] max-w-md -translate-x-1/2 sm:bottom-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white shadow-xl"
      >
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-400 sm:text-sm">{totalQty} items</p>
          <p className="text-base font-bold sm:text-lg">Rs {totalPrice}</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/student/cart")}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-105 sm:px-5 sm:text-base"
        >
          <span>View Cart</span>
          <FiShoppingCart size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}
