import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getPlatformStats, getVendors } from "../../api/adminApi";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVendors: 0,
    totalShops: 0,
    openShops: 0,
    todayOrders: 0,
    revenueToday: 0,
    vendorsWithoutShop: 0,
  });
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, vendorsRes] = await Promise.all([
        getPlatformStats(),
        getVendors(),
      ]);

      setStats(statsRes.data);
      setVendors(vendorsRes.data.slice(0, 6));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AppLayout showCartBar={false}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="py-4 text-white sm:py-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin/shops")}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105 sm:w-auto sm:text-base"
          >
            Manage Shops
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="Students" value={stats.totalStudents} />
          <StatCard label="Vendors" value={stats.totalVendors} />
          <StatCard label="Total Shops" value={stats.totalShops} />
          <StatCard label="Open Shops" value={stats.openShops} />
          <StatCard label="Today's Orders" value={stats.todayOrders} />
          <StatCard label="Today Revenue" value={`Rs ${stats.revenueToday}`} />
          <StatCard label="Unassigned Vendors" value={stats.vendorsWithoutShop} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-2xl bg-gray-900 p-4 sm:p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Vendors</h2>

          {vendors.length === 0 ? (
            <p className="text-gray-400 text-sm">No vendors found.</p>
          ) : (
            <div className="space-y-3">
              {vendors.map(vendor => (
                <div
                  key={vendor._id}
                  className="bg-gray-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{vendor.name}</p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{vendor.email}</p>
                  </div>

                  <div className="text-xs sm:text-sm">
                    {vendor.shop ? (
                      <span className="text-green-400">
                        {vendor.shop.name} ({vendor.shop.isOpen ? "Open" : "Closed"})
                      </span>
                    ) : (
                      <span className="text-amber-400">No shop assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="bg-gray-900 rounded-xl p-4 sm:p-5">
      <p className="text-gray-400 text-xs sm:text-sm">{label}</p>
      <h2 className="text-lg sm:text-2xl font-bold mt-1">{value}</h2>
    </motion.div>
  );
}
