import { motion } from "framer-motion";
import {
  FiClipboard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiShoppingBag,
  FiShoppingCart,
  FiTv,
} from "react-icons/fi";
import { LuUtensilsCrossed } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const getTitle = (pathname) => {
  if (pathname === "/student/home") return "Campus Shops";
  if (pathname.startsWith("/shop/")) return "Shop Items";
  if (pathname === "/student/cart") return "Your Cart";
  if (pathname === "/student/payment") return "Payment";
  if (pathname.startsWith("/student/payment/confirmation/")) return "Payment Confirmed";
  if (pathname === "/student/orders") return "My Orders";
  if (pathname.startsWith("/student/order/")) return "Order Status";

  if (pathname === "/vendor") return "Manager View";
  if (pathname === "/vendor/orders") return "Order Board";
  if (pathname === "/vendor/items") return "Manage Items";
  if (pathname === "/vendor/kitchen") return "Kitchen View";
  if (pathname === "/chef/kitchen") return "Kitchen View";

  if (pathname === "/admin") return "Admin Dashboard";
  if (pathname === "/admin/shops") return "Manage Shops";

  return "Campus Eats";
};

const getHomePathByRole = (role) => {
  if (role === "admin") return "/admin";
  if (role === "chef") return "/chef/kitchen";
  if (role === "vendor") return "/vendor";
  return "/student/home";
};

const getBadgeText = (count) => {
  if (count > 99) return "99+";
  return String(count);
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartItems, clearCart } = useCart();

  const role = user?.role || "student";
  const homePath = getHomePathByRole(role);
  const pageTitle = getTitle(location.pathname);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const showBack = location.pathname !== homePath && location.pathname !== "/login";
  const showSubtitle = showBack && pageTitle !== "Campus Eats";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(homePath, { replace: true });
  };

  const handleLogout = () => {
    clearCart();
    logout();
    navigate("/login", { replace: true });
  };

  const handleBrandClick = () => {
    navigate(homePath);
  };

  const studentActions = [
    {
      key: "home",
      label: "Home",
      icon: FiHome,
      active: location.pathname === "/student/home" || location.pathname.startsWith("/shop/"),
      onClick: () => navigate("/student/home"),
    },
    {
      key: "orders",
      label: "Orders",
      icon: FiClipboard,
      active: location.pathname === "/student/orders" || location.pathname.startsWith("/student/order/"),
      onClick: () => navigate("/student/orders"),
    },
    {
      key: "cart",
      label: "Cart",
      icon: FiShoppingCart,
      active: location.pathname === "/student/cart" || location.pathname.startsWith("/student/payment"),
      onClick: () => navigate("/student/cart"),
      badge: cartCount,
    },
  ];

  const vendorActions = [
    {
      key: "manager",
      label: "Manager",
      icon: FiGrid,
      active: location.pathname === "/vendor",
      onClick: () => navigate("/vendor"),
    },
    {
      key: "orders",
      label: "Orders",
      icon: FiClipboard,
      active: location.pathname === "/vendor/orders",
      onClick: () => navigate("/vendor/orders"),
    },
  ];

  const chefActions = [
    {
      key: "kitchen",
      label: "Kitchen",
      icon: FiTv,
      active: location.pathname === "/chef/kitchen" || location.pathname === "/vendor/kitchen",
      onClick: () => navigate("/chef/kitchen"),
    },
  ];

  const adminActions = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: FiGrid,
      active: location.pathname === "/admin",
      onClick: () => navigate("/admin"),
    },
    {
      key: "shops",
      label: "Shops",
      icon: FiShoppingBag,
      active: location.pathname === "/admin/shops",
      onClick: () => navigate("/admin/shops"),
    },
  ];

  const actions = role === "admin"
    ? adminActions
    : role === "vendor"
      ? vendorActions
      : role === "chef"
        ? chefActions
      : studentActions;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleBack}
              className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700"
            >
              Back
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={handleBrandClick}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-slate-900/80"
          >
            <motion.div
              animate={{ rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-orange-400/40 bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-[0_8px_24px_rgba(249,115,22,0.35)]"
            >
              <LuUtensilsCrossed size={15} />
            </motion.div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold tracking-wide text-slate-100 sm:text-base">
                Campus Eats
              </h1>
              {showSubtitle && (
                <p className="truncate text-[11px] font-medium text-slate-400 sm:text-xs">
                  {pageTitle}
                </p>
              )}
            </div>
          </motion.button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-1.5">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <motion.button
                key={action.key}
                whileTap={{ scale: 0.96 }}
                onClick={action.onClick}
                title={action.label}
                className={`relative inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-semibold transition sm:gap-1 sm:px-2.5 sm:text-xs ${
                  action.active
                    ? "border-orange-400/50 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950"
                    : "border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-600 hover:bg-slate-700"
                }`}
              >
                <Icon size={14} />
                <span className="hidden lg:inline">{action.label}</span>
                {typeof action.badge === "number" && action.badge > 0 && (
                  <span className="absolute right-0.5 top-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {getBadgeText(action.badge)}
                  </span>
                )}
              </motion.button>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleLogout}
            title="Logout"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[11px] font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700 sm:gap-1 sm:px-2.5 sm:text-xs"
          >
            <FiLogOut size={14} />
            <span className="hidden lg:inline">Logout</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
