import { useMemo, useRef, useEffect, useState } from "react";
import { FiCheck, FiFilter, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../../api/orderApi";
import AppLayout from "../../components/layout/AppLayout";

const SORT_OPTIONS = [
  { value: "latest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount-high", label: "Amount High-Low" },
  { value: "amount-low", label: "Amount Low-High" },
];

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);

  const loadOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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

  const visibleOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = normalizedSearch
      ? orders.filter((order) => {
          const orderNumber = String(order.orderNumber || "").toLowerCase();
          const shopName = String(order.shop?.name || "").toLowerCase();
          const status = String(order.status || "").toLowerCase();
          return (
            orderNumber.includes(normalizedSearch) ||
            shopName.includes(normalizedSearch) ||
            status.includes(normalizedSearch)
          );
        })
      : orders;

    if (sortMode === "oldest") {
      return [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    if (sortMode === "amount-high") {
      return [...filtered].sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
    }

    if (sortMode === "amount-low") {
      return [...filtered].sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
    }

    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, searchTerm, sortMode]);

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortMode)?.label || "Newest";

  return (
    <AppLayout showCartBar={false}>
      <div className="mx-auto max-w-3xl py-4 text-white sm:py-6">
        <h1 className="mb-6 text-xl font-bold sm:text-2xl">My Orders</h1>

        <div className="mb-4 flex items-center gap-2 sm:gap-3">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5">
            <FiSearch className="text-slate-400" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order, shop or status"
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
          Showing {visibleOrders.length} order{visibleOrders.length === 1 ? "" : "s"} | Sort:{" "}
          {selectedSortLabel}
        </p>

        {visibleOrders.length === 0 && <p className="text-gray-400">No orders yet</p>}

        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <button
              key={order._id}
              onClick={() => navigate(`/student/order/${order._id}`)}
              className="w-full rounded-xl bg-gray-900 p-4 text-left transition hover:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="break-all text-sm font-bold sm:text-base">
                  Order #{order.orderNumber}
                </h3>
                <span className="whitespace-nowrap text-xs font-bold text-orange-400 sm:text-sm">
                  {order.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-400 sm:text-base">Shop: {order.shop?.name}</p>

              <p className="text-sm text-gray-400 sm:text-base">Total: Rs {order.totalAmount}</p>

              <div className="mt-3 text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
