import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartItems, clearCart } = useCart();

  if (!user) return null;

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const handleLogout = () => {
    clearCart();
    logout();
    navigate("/login", { replace: true });
  };

  const studentItems = [
    {
      label: "Home",
      key: "home",
      onClick: () => navigate("/student/home"),
      active: location.pathname === "/student/home" || location.pathname.startsWith("/shop/"),
    },
    {
      label: "Orders",
      key: "orders",
      onClick: () => navigate("/student/orders"),
      active: location.pathname === "/student/orders" || location.pathname.startsWith("/student/order/"),
    },
    {
      label: "Cart",
      key: "cart",
      onClick: () => navigate("/student/cart"),
      active: location.pathname === "/student/cart" || location.pathname.startsWith("/student/payment"),
    },
  ];

  const vendorItems = [
    {
      label: "Dashboard",
      key: "dashboard",
      onClick: () => navigate("/vendor"),
      active: location.pathname === "/vendor",
    },
    {
      label: "Orders",
      key: "orders",
      onClick: () => navigate("/vendor/orders"),
      active: location.pathname === "/vendor/orders",
    },
    {
      label: "Items",
      key: "items",
      onClick: () => navigate("/vendor/items"),
      active: location.pathname === "/vendor/items",
    },
  ];

  const adminItems = [
    {
      label: "Dashboard",
      key: "dashboard",
      onClick: () => navigate("/admin"),
      active: location.pathname === "/admin",
    },
    {
      label: "Shops",
      key: "shops",
      onClick: () => navigate("/admin/shops"),
      active: location.pathname === "/admin/shops",
    },
  ];

  const items = user.role === "admin"
    ? adminItems
    : user.role === "vendor"
      ? vendorItems
      : studentItems;

  const totalColumns = items.length + 1;

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 z-40 p-2 sm:p-3"
    >
      <div
        className="mx-auto grid w-full max-w-6xl gap-1 rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur"
        style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <motion.button
            key={item.key}
            whileTap={{ scale: 0.95 }}
            onClick={item.onClick}
            className={`whitespace-nowrap rounded-lg py-2 text-[11px] transition sm:text-xs md:text-sm ${
              item.active
                ? "bg-gradient-to-r from-orange-500 to-amber-500 font-bold text-slate-950"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            {item.label}
            {item.key === "cart" && cartCount > 0 && (
              <span className="ml-1 text-[10px] sm:text-xs">({cartCount})</span>
            )}
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="whitespace-nowrap rounded-lg py-2 text-[11px] text-slate-200 transition hover:bg-slate-800 sm:text-xs md:text-sm"
        >
          Logout
        </motion.button>
      </div>
    </motion.div>
  );
}
