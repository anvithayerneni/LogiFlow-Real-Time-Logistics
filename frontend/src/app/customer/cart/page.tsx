"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Address, Order } from "@/types";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, currentRestaurant, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, tax, total } = useCart();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState<string>("Leave at door / ring bell");
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAddresses() {
      if (!user) return;
      try {
        const data = await apiFetch<Address[]>("/users/me/addresses");
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error("Failed to load user addresses", err);
      }
    }
    loadAddresses();
  }, [user]);

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!currentRestaurant || items.length === 0) return;

    setError(null);
    setPlacingOrder(true);
    try {
      const orderPayload = {
        restaurant_id: currentRestaurant.id,
        delivery_address_id: selectedAddressId || undefined,
        items: items.map((i) => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          special_instructions: i.specialInstructions,
        })),
        customer_notes: customerNotes,
      };

      const createdOrder = await apiFetch<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      clearCart();
      // Redirect to the Showcase Live Order Tracking Page!
      router.push(`/customer/orders/${createdOrder.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto shadow-xl">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400">Add delicious meals from local restaurants to begin your order.</p>
        <Link
          href="/customer/restaurants"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/20"
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href={`/customer/restaurants/${currentRestaurant?.id || ""}`}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <button
          onClick={clearCart}
          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              Items from <span className="text-brand-400">{currentRestaurant?.name}</span>
            </h2>

            <div className="divide-y divide-slate-800/80">
              {items.map((item) => (
                <div key={item.menuItem.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">{item.menuItem.name}</h4>
                    <div className="text-xs text-brand-400 font-bold">
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700/60 rounded-xl px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="p-1 hover:text-white text-slate-400 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="p-1 hover:text-white text-slate-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address & Notes */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>Delivery Destination</span>
            </h3>

            {addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedAddressId === a.id
                        ? "bg-brand-500/10 border-brand-500 text-white"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="text-brand-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold">{a.label}</div>
                        <div className="text-slate-400">{a.street}, {a.city}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                Default location: 742 Montgomery St, San Francisco, CA
              </div>
            )}

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-slate-300">Driver Delivery Instructions</label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Gate code, drop-off instructions, ring bell..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl sticky top-24">
            <h3 className="text-base font-bold text-white">Order Summary</h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery Fee</span>
                <span className="font-semibold text-white">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Taxes & Fees (8.25%)</span>
                <span className="font-semibold text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-brand-400 text-base">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Simulated Payment Notice */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                <CreditCard className="w-4 h-4" />
                <span>Simulated Sandbox Payment</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Card ending in <span className="font-mono text-slate-200">4242</span>. No real funds are charged.
                Instant test authorization will be executed.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold text-sm text-white shadow-xl shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {placingOrder ? (
                <span>Authorizing & Dispatching...</span>
              ) : (
                <>
                  <span>Place Order • ${total.toFixed(2)}</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
