import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import CartBar from "../order/CartBar";
import Navbar from "./Navbar";

export default function AppLayout({ children, showCartBar = false }) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 right-0 h-60 w-60 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <Navbar />

      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative z-10 ${showCartBar ? "pb-28 sm:pb-32" : "pb-6"}`}
      >
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6">
          {children}
        </div>
      </motion.main>

      {showCartBar && <CartBar />}
    </div>
  );
}
