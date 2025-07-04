"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Utensils, CheckCircle, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MenuItem, Restaurant } from "@/types";

export default function RestaurantMenuManagerPage() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New item form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const rests = await apiFetch<Restaurant[]>("/restaurants");
      if (rests.length > 0) {
        const myRest = rests[0]; // Active managed restaurant
        setRestaurant(myRest);
        const menuData = await apiFetch<MenuItem[]>(`/restaurants/${myRest.id}/menu`);
        setItems(menuData);
      }
    } catch (err) {
      console.error("Failed to load menu", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!restaurant) return;
    try {
      await apiFetch(`/restaurants/${restaurant.id}/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      );
    } catch (err: any) {
      alert(err.message || "Failed to toggle item availability");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!restaurant || !confirm("Are you sure you want to remove this dish?")) return;
    try {
      await apiFetch(`/restaurants/${restaurant.id}/items/${itemId}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || "Failed to delete item");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<MenuItem>(`/restaurants/${restaurant.id}/items`, {
        method: "POST",
        body: JSON.stringify({
          name: newItemName,
          description: newItemDesc,
          price: parseFloat(newItemPrice),
          is_available: true,
        }),
      });
      setItems((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewItemName("");
      setNewItemDesc("");
      setNewItemPrice("");
    } catch (err: any) {
      alert(err.message || "Failed to add menu item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Utensils className="w-8 h-8 text-brand-400" />
            <span>Menu Catalog Manager</span>
          </h1>
          <p className="text-xs text-slate-400">
            {restaurant ? `Editing dishes for ${restaurant.name}` : "Manage restaurant dishes and stock"}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800 overflow-hidden shadow-xl">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm text-white">{item.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.is_available
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {item.is_available ? "In Stock" : "Sold Out"}
                  </span>
                </div>
                {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                <div className="text-xs font-bold text-brand-400">${item.price.toFixed(2)}</div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    item.is_available
                      ? "bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border-slate-700"
                      : "bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700"
                  }`}
                >
                  {item.is_available ? "Mark Sold Out" : "Mark Available"}
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete dish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Menu Dish</h3>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Pappardelle"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Description</label>
                <textarea
                  rows={3}
                  placeholder="Ingredients and culinary notes..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="19.50"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
