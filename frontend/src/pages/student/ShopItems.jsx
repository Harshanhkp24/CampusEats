import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiFilter, FiSearch } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { getItemsByShop } from "../../api/itemApi";
import API from "../../api/axios";
import ItemCard from "../../components/shop/ItemCard";
import AppLayout from "../../components/layout/AppLayout";
import { resolveMediaUrl } from "../../utils/media";

const FALLBACK_SHOP_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5";

const SORT_OPTIONS = [
  { value: "relevance", label: "Default" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "price-asc", label: "Price Low-High" },
  { value: "price-desc", label: "Price High-Low" },
];

export default function ShopItems() {
  const { shopId } = useParams();

  const [items, setItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("relevance");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);
  const isShopOpen = shop ? shop.isOpen !== false : false;

  const loadItems = async () => {
    try {
      const res = await getItemsByShop(shopId);
      setItems(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const loadShop = async () => {
    try {
      const res = await API.get(`/shops/${shopId}`);
      setShop(res.data);
    } catch (err) {
      console.log("Shop API not ready yet");
    }
  };

  useEffect(() => {
    if (!shopId) return;
    loadItems();
    loadShop();
  }, [shopId]);

  useEffect(() => {
    if (!isSortOpen) return;

    const handleOutsideClick = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isSortOpen]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const filtered = normalizedQuery
      ? items.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
      : items;

    if (sortMode === "name-asc") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortMode === "price-asc") {
      return [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortMode === "price-desc") {
      return [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return filtered;
  }, [items, searchTerm, sortMode]);

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortMode)?.label || "Default";

  return (
    <AppLayout showCartBar>
      <div className="pt-4 text-white sm:pt-6">
        {shop && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-slate-800"
          >
            <img
              src={resolveMediaUrl(shop.thumbnailUrl) || FALLBACK_SHOP_IMAGE}
              alt={shop.name}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_SHOP_IMAGE;
              }}
              className="h-32 w-full object-cover sm:h-40"
            />

            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-lg font-bold sm:text-2xl">{shop.name}</h1>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wide sm:text-xs ${
                    isShopOpen ? "bg-green-500 text-slate-950" : "bg-red-500 text-white"
                  }`}
                >
                  {isShopOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="py-4">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-4 text-xl font-bold sm:text-2xl"
          >
            Shop Items
          </motion.h1>

          <div className="mb-4 flex items-center gap-2 sm:gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5">
              <FiSearch className="text-slate-400" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 sm:text-base"
              />
            </label>

            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-lime-500/30 bg-lime-500/20 px-3 text-lime-300 transition hover:bg-lime-500/30"
                title={`Sort: ${selectedSortLabel}`}
              >
                <FiFilter size={17} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-12 z-30 w-44 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortMode(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        option.value === sortMode
                          ? "bg-orange-500/20 text-orange-300"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.value === sortMode && <FiCheck size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="mb-3 text-xs text-slate-400 sm:text-sm">
            Showing {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"} | Sort:{" "}
            {selectedSortLabel}
          </p>

          {!isShopOpen && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              This shop is currently closed. New orders are disabled until the shop opens.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {visibleItems.map((item) => (
              <ItemCard key={item._id} item={item} shopIsOpen={isShopOpen} />
            ))}
          </div>

          {visibleItems.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
              No items found for your search.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
