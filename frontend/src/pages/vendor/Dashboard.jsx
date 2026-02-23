import { motion } from "framer-motion";
import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import {
  createChefAccount,
  getVendorManagerOverview,
  setVendorShopStatus,
  uploadVendorShopPoster,
} from "../../api/vendorApi";
import { subscribeToShopEvents } from "../../api/streamApi";
import { resolveMediaUrl } from "../../utils/media";

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5";

export default function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    date: "",
    shop: null,
    stats: {
      todayOrders: 0,
      liveOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
      activeItems: 0,
      revenueToday: 0,
    },
    paymentSummary: {
      PAID: { count: 0, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      FAILED: { count: 0, amount: 0 },
      REFUNDED: { count: 0, amount: 0 },
    },
    recentOrders: [],
    chefs: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isCreatingChef, setIsCreatingChef] = useState(false);
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState("");
  const [chefForm, setChefForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const refreshTimeoutRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!posterFile) {
      setPosterPreviewUrl("");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(posterFile);
    setPosterPreviewUrl(localPreviewUrl);

    return () => {
      URL.revokeObjectURL(localPreviewUrl);
    };
  }, [posterFile]);

  useEffect(() => {
    loadOverview();

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) return;

      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        loadOverview();
      }, 250);
    };

    const unsubscribe = subscribeToShopEvents({
      onEvent: (event) => {
        if (event?.type === "order.created") {
          audioRef.current?.play?.().catch(() => {});
        }
        scheduleRefresh();
      },
      onError: () => {},
    });

    const fallbackInterval = setInterval(loadOverview, 45000);

    return () => {
      clearInterval(fallbackInterval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, []);

  const loadOverview = async () => {
    try {
      const res = await getVendorManagerOverview();
      setOverview(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load manager overview.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShopStatus = async () => {
    if (!overview.shop || isStatusUpdating) return;

    setIsStatusUpdating(true);
    setStatusMessage("");

    try {
      const nextOpenStatus = !overview.shop.isOpen;
      const res = await setVendorShopStatus(nextOpenStatus);
      setStatusMessage(res.data?.message || "Shop status updated.");
      await loadOverview();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update shop status.");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleChefInput = (key, value) => {
    setChefForm((prev) => ({ ...prev, [key]: value }));
  };

  const activePosterUrl = useMemo(() => {
    if (posterPreviewUrl) return posterPreviewUrl;
    return resolveMediaUrl(overview.shop?.thumbnailUrl) || FALLBACK_POSTER;
  }, [overview.shop?.thumbnailUrl, posterPreviewUrl]);

  const handlePosterFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setPosterFile(selectedFile || null);
  };

  const handlePosterUpload = async () => {
    if (!posterFile || isPosterUploading) {
      return;
    }

    const formData = new FormData();
    formData.append("poster", posterFile);

    setIsPosterUploading(true);
    setStatusMessage("");

    try {
      const res = await uploadVendorShopPoster(formData);
      setStatusMessage(res.data?.message || "Shop poster updated.");
      setPosterFile(null);
      await loadOverview();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to upload shop poster.");
    } finally {
      setIsPosterUploading(false);
    }
  };

  const handleCreateChef = async (e) => {
    e.preventDefault();
    if (isCreatingChef) return;

    setIsCreatingChef(true);
    setStatusMessage("");

    try {
      const res = await createChefAccount({
        name: chefForm.name,
        email: chefForm.email,
        phone: chefForm.phone,
        password: chefForm.password,
      });

      setStatusMessage(res.data?.message || "Chef account created.");
      setChefForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
      await loadOverview();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create chef account.");
    } finally {
      setIsCreatingChef(false);
    }
  };

  return (
    <AppLayout>
      <div className="py-4 text-white sm:py-6">
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Manager View</h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Business overview for {overview.date || "today"}.
            </p>
          </div>

          {overview.shop && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
              <span className="text-sm font-semibold">{overview.shop.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  overview.shop.isOpen
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {overview.shop.isOpen ? "OPEN" : "CLOSED"}
              </span>
              <button
                onClick={toggleShopStatus}
                disabled={isStatusUpdating}
                className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isStatusUpdating
                  ? "Updating..."
                  : overview.shop.isOpen
                    ? "Close Shop"
                    : "Open Shop"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {error}
          </p>
        )}

        {statusMessage && (
          <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            {statusMessage}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
            Loading manager data...
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-6">
              <MetricCard label="Today's Orders" value={overview.stats.todayOrders} />
              <MetricCard label="Live Queue" value={overview.stats.liveOrders} accent="text-orange-300" />
              <MetricCard label="Completed" value={overview.stats.completedOrders} accent="text-green-300" />
              <MetricCard label="Rejected" value={overview.stats.rejectedOrders} accent="text-red-300" />
              <MetricCard label="Active Items" value={overview.stats.activeItems} />
              <MetricCard label="Revenue Today" value={`Rs ${overview.stats.revenueToday}`} />
            </div>

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <h2 className="mb-3 text-lg font-bold sm:text-xl">Shop Poster Image</h2>
              <p className="mb-4 text-xs text-slate-400 sm:text-sm">
                Vendor-only control. Upload a local image file to change your shop poster.
              </p>

              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <img
                  src={activePosterUrl}
                  alt={overview.shop?.name || "Shop poster"}
                  className="h-40 w-full rounded-xl border border-slate-700 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_POSTER;
                  }}
                />

                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterFileChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-orange-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-950"
                  />

                  <button
                    onClick={handlePosterUpload}
                    disabled={!posterFile || isPosterUploading}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPosterUploading ? "Uploading..." : "Upload Poster"}
                  </button>

                  <p className="text-xs text-slate-400">
                    Allowed file types: image/*, max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <h2 className="mb-3 text-lg font-bold sm:text-xl">Payment Status Overview</h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PaymentCard
                  label="Paid"
                  tone="green"
                  count={overview.paymentSummary?.PAID?.count || 0}
                  amount={overview.paymentSummary?.PAID?.amount || 0}
                />
                <PaymentCard
                  label="Pending"
                  tone="amber"
                  count={overview.paymentSummary?.PENDING?.count || 0}
                  amount={overview.paymentSummary?.PENDING?.amount || 0}
                />
                <PaymentCard
                  label="Failed"
                  tone="red"
                  count={overview.paymentSummary?.FAILED?.count || 0}
                  amount={overview.paymentSummary?.FAILED?.amount || 0}
                />
                <PaymentCard
                  label="Refunded"
                  tone="cyan"
                  count={overview.paymentSummary?.REFUNDED?.count || 0}
                  amount={overview.paymentSummary?.REFUNDED?.amount || 0}
                />
              </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                <h2 className="mb-3 text-lg font-bold sm:text-xl">Create Chef ID</h2>
                <p className="mb-4 text-xs text-slate-400 sm:text-sm">
                  Chef accounts can only access Kitchen View and update order status.
                </p>

                <form onSubmit={handleCreateChef} className="space-y-3">
                  <input
                    value={chefForm.name}
                    onChange={(e) => handleChefInput("name", e.target.value)}
                    placeholder="Chef name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                  <input
                    value={chefForm.email}
                    onChange={(e) => handleChefInput("email", e.target.value)}
                    placeholder="chef@college.edu"
                    type="email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                  <input
                    value={chefForm.phone}
                    onChange={(e) => handleChefInput("phone", e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                  <input
                    value={chefForm.password}
                    onChange={(e) => handleChefInput("password", e.target.value)}
                    placeholder="Temporary password"
                    type="password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isCreatingChef}
                    className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreatingChef ? "Creating..." : "Create Chef Account"}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                <h2 className="mb-3 text-lg font-bold sm:text-xl">Assigned Chef Accounts</h2>
                {overview.chefs?.length ? (
                  <div className="space-y-2">
                    {overview.chefs.map((chef) => (
                      <div
                        key={chef._id}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                      >
                        <p className="text-sm font-semibold">{chef.name}</p>
                        <p className="text-xs text-slate-400">{chef.email}</p>
                        <p className="text-xs text-slate-400">{chef.phone}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No chef accounts assigned yet.</p>
                )}
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold sm:text-xl">Recent Orders</h2>
                <button
                  onClick={() => navigate("/vendor/orders")}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Open Full Orders View
                </button>
              </div>

              {overview.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-400">No orders for selected day.</p>
              ) : (
                <div className="space-y-2">
                  {overview.recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-slate-400">{order.user?.name}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-orange-300">Rs {order.totalAmount}</p>
                          <p className="text-slate-400">
                            {order.status} | {order.payment?.status || "PAID"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionCard
                title="Order Control"
                subtitle="Accept/Reject and mark pickup securely"
                onClick={() => navigate("/vendor/orders")}
              />
              <QuickActionCard
                title="Manage Items"
                subtitle="Update menu and item availability"
                onClick={() => navigate("/vendor/items")}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, accent = "text-white" }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
      <p className={`mt-1 text-lg font-bold sm:text-2xl ${accent}`}>{value}</p>
    </motion.div>
  );
}

function PaymentCard({ label, count, amount, tone }) {
  const toneMap = {
    green: "text-green-300 border-green-500/20 bg-green-500/5",
    amber: "text-amber-300 border-amber-500/20 bg-amber-500/5",
    red: "text-red-300 border-red-500/20 bg-red-500/5",
    cyan: "text-cyan-300 border-cyan-500/20 bg-cyan-500/5",
  };

  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone] || toneMap.green}`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-xl font-bold">{count}</p>
      <p className="text-xs">Rs {amount}</p>
    </div>
  );
}

function QuickActionCard({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-800"
    >
      <p className="text-base font-bold">{title}</p>
      <p className="mt-1 text-xs text-slate-400 sm:text-sm">{subtitle}</p>
    </button>
  );
}
