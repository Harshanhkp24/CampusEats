import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { addItem } from "../../api/itemApi";

export default function ManageItems() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");

    try {
      await addItem({
        name,
        price: Number(price),
      });

      setMessage("Item added successfully.");
      setName("");
      setPrice("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to add item.");
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
            onChange={e => setName(e.target.value)}
            placeholder="Item Name"
            className="w-full p-3 rounded bg-gray-800"
            required
          />

          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Price"
            type="number"
            min="1"
            className="w-full p-3 rounded bg-gray-800"
            required
          />

          {message && (
            <p className="text-sm text-gray-300">{message}</p>
          )}

          <button className="w-full bg-orange-500 py-3 rounded-xl font-bold">
            Add Item
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
