import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getShopQueue } from "../../api/orderApi";
import { resolveMediaUrl } from "../../utils/media";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5";

export default function ShopCard({ shop }) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState(0);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await getShopQueue(shop._id);
      setQueue(res.data.queue);
      setWait(res.data.estimatedWait);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => navigate(`/shop/${shop._id}`)}
      className="h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
    >
      <div className="relative">
        <img
          src={resolveMediaUrl(shop.thumbnailUrl) || FALLBACK_THUMBNAIL}
          alt={shop.name}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_THUMBNAIL;
          }}
          className="h-40 w-full object-cover"
        />

        <motion.div
          animate={shop.isOpen ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            shop.isOpen ? "bg-green-500 text-slate-950" : "bg-red-500 text-white"
          }`}
        >
          {shop.isOpen ? "OPEN" : "CLOSED"}
        </motion.div>
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-bold sm:text-lg">{shop.name}</h3>

        <div className="mt-3 flex justify-between text-xs text-slate-300 sm:text-sm">
          <span>Queue: {queue}</span>
          <span>Wait: {wait} min</span>
        </div>
      </div>
    </motion.div>
  );
}
