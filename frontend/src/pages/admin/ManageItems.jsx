import { useState } from "react";
import { addItem } from "../../api/itemApi";
import AppLayout from "../../components/layout/AppLayout";

export default function ManageItems() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addItem({
        name,
        price: Number(price),
      });

      alert("Item added successfully");
      setName("");
      setPrice("");
    } catch (err) {
      console.log(err);
      alert(err?.response?.data?.message || "Failed to add item");
    }
  };

  return (
    <AppLayout showCartBar={false}>
      <div className="py-4 sm:py-6 text-white max-w-md mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Add Menu Item</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-4 sm:p-6 rounded-xl space-y-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item Name"
            className="w-full p-3 rounded bg-gray-800"
            required
          />

          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            type="number"
            className="w-full p-3 rounded bg-gray-800"
            required
          />

          <button className="w-full bg-orange-500 py-3 rounded-xl font-bold">
            Add Item
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
