import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getVendors } from "../../api/adminApi";
import {
  assignVendorToShop,
  closeShop,
  createShop,
  getAllShops,
  openShop,
} from "../../api/shopApi";

const getOwnerId = (shop) =>
  typeof shop.createdBy === "string"
    ? shop.createdBy
    : shop.createdBy?._id || "";

export default function ManageShops() {
  const [shops, setShops] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [shopName, setShopName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [shopAssignments, setShopAssignments] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shopsRes, vendorsRes] = await Promise.all([
        getAllShops(),
        getVendors(),
      ]);

      const nextShops = shopsRes.data;
      const nextVendors = vendorsRes.data;

      setShops(nextShops);
      setVendors(nextVendors);

      const nextAssignments = {};
      nextShops.forEach((shop) => {
        nextAssignments[shop._id] = getOwnerId(shop);
      });
      setShopAssignments(nextAssignments);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load shop data.");
    }
  };

  const availableVendors = useMemo(
    () => vendors.filter((vendor) => !vendor.shop),
    [vendors],
  );

  const vendorNameById = useMemo(
    () => new Map(vendors.map((vendor) => [vendor._id, vendor.name])),
    [vendors],
  );

  const getEligibleVendorsForShop = (shop) => {
    const currentOwnerId = getOwnerId(shop);
    return vendors.filter(
      (vendor) => !vendor.shop || vendor._id === currentOwnerId,
    );
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await createShop({
        name: shopName,
        ownerId,
      });

      setMessage("Shop created and vendor assigned.");
      setShopName("");
      setOwnerId("");
      loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to create shop.");
    }
  };

  const handleAssignVendor = async (shop) => {
    setMessage("");

    const nextOwnerId = shopAssignments[shop._id];
    if (!nextOwnerId) {
      setMessage("Please select a vendor to assign.");
      return;
    }

    try {
      await assignVendorToShop(shop._id, nextOwnerId);
      setMessage("Vendor assigned successfully.");
      loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to assign vendor.");
    }
  };

  const toggleShopStatus = async (shop) => {
    try {
      if (shop.isOpen) {
        await closeShop(shop._id);
      } else {
        await openShop(shop._id);
      }
      loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to update shop.");
    }
  };

  return (
    <AppLayout showCartBar={false}>
      <div className="py-4 sm:py-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Manage Shops</h1>

        <form
          onSubmit={handleCreateShop}
          className="bg-gray-900 rounded-2xl p-4 sm:p-6 grid md:grid-cols-3 gap-3 mb-6"
        >
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Shop Name"
            className="p-3 rounded bg-gray-800"
            required
          />

          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="p-3 rounded bg-gray-800"
            required
          >
            <option value="">Assign Vendor</option>
            {availableVendors.map((vendor) => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.name} ({vendor.email})
              </option>
            ))}
          </select>

          <button className="bg-orange-500 rounded-lg px-4 py-3 font-semibold">
            Create Shop
          </button>
        </form>

        {message && (
          <p className="mb-4 text-sm text-gray-300">{message}</p>
        )}

        <div className="space-y-3">
          {shops.map((shop) => {
            const assignedOwnerId = getOwnerId(shop);
            const eligibleVendors = getEligibleVendorsForShop(shop);

            return (
              <div
                key={shop._id}
                className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold">{shop.name}</p>
                    <p className="text-sm text-gray-400">
                      Vendor: {vendorNameById.get(assignedOwnerId) || "Unassigned"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        shop.isOpen
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {shop.isOpen ? "OPEN" : "CLOSED"}
                    </span>
                    <button
                      onClick={() => toggleShopStatus(shop)}
                      className="bg-gray-800 rounded-lg px-3 py-2 text-sm"
                    >
                      {shop.isOpen ? "Close Shop" : "Open Shop"}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-[1fr_auto] gap-2">
                  <select
                    value={shopAssignments[shop._id] || ""}
                    onChange={(e) =>
                      setShopAssignments((prev) => ({
                        ...prev,
                        [shop._id]: e.target.value,
                      }))
                    }
                    className="p-3 rounded bg-gray-800"
                  >
                    <option value="">Select Vendor</option>
                    {eligibleVendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.name} ({vendor.email})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleAssignVendor(shop)}
                    className="bg-orange-500 rounded-lg px-4 py-2 text-sm font-semibold"
                  >
                    Assign Vendor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
