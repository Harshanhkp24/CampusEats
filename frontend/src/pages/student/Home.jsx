import AppLayout from "../../components/layout/AppLayout";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllShops } from "../../api/shopApi";
import ShopCard from "../../components/shop/ShopCard";

export default function Home() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    const res = await getAllShops();
    setShops(res.data);
  };

  return (
    <AppLayout>
      <section className="pt-4 sm:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mb-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
            Fresh picks
          </p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Campus Shops</h1>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <ShopCard key={shop._id} shop={shop} />
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
