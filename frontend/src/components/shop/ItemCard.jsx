import { motion } from "framer-motion";
import { FiMinus, FiPlus, FiShoppingCart } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function ItemCard({ item, shopIsOpen = true }) {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { shopId } = useParams();
  const isDisabled = !shopIsOpen || item.isAvailable === false;
  const cartLine = cartItems.find((cartItem) => cartItem._id === item._id);
  const qty = cartLine?.qty || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-white shadow-[0_8px_25px_rgba(0,0,0,0.25)] sm:p-4"
    >
      <div className="min-w-0">
        <h3 className="font-bold text-sm sm:text-base truncate">{item.name}</h3>
        <p className="text-sm font-semibold text-orange-400 sm:text-base">Rs {item.price}</p>
      </div>

      {qty > 0 ? (
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => removeFromCart(item._id)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-600 bg-slate-800 text-white transition hover:border-slate-500 hover:bg-slate-700"
            aria-label={`Decrease quantity for ${item.name}`}
          >
            <FiMinus size={14} />
          </motion.button>

          <span className="w-7 text-center text-sm font-bold sm:text-base">{qty}</span>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => addToCart(item, shopId)}
            disabled={isDisabled}
            className="grid h-9 w-9 place-items-center rounded-full border border-orange-400/40 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-300"
            aria-label={`Increase quantity for ${item.name}`}
          >
            <FiPlus size={14} />
          </motion.button>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!isDisabled) addToCart(item, shopId);
          }}
          disabled={isDisabled}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-300 sm:px-4 sm:text-base"
        >
          <FiShoppingCart size={14} />
          <span>{!shopIsOpen ? "Closed" : item.isAvailable === false ? "Sold Out" : "Add"}</span>
        </motion.button>
      )}
    </motion.div>
  );
}
