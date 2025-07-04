"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Package, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>("/orders");
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "OUT_FOR_DELIVERY":
      case "PICKED_UP":
        return "bg-brand-500/10 text-brand-400 border-brand-500/20 animate-pulse";
      case "PREPARING":
      case "CONFIRMED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CANCELLED":
      case "REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Orders</h1>
          <p className="text-xs text-slate-400">Track current meal deliveries and view order history</p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No orders placed yet</h3>
          <p className="text-xs text-slate-500">Order from your favorite restaurant to see it here</p>
          <Link
            href="/customer/restaurants"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs"
          >
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-white text-base">
                    {order.restaurant_name || "Restaurant"}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>
                    {order.items?.map((item) => `${item.quantity}x ${item.item_name}`).join(", ") ||
                      "Order items"}
                  </div>
                  <div className="text-slate-500">
                    Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
                    {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-base font-bold text-white">${order.total_amount.toFixed(2)}</div>
                </div>

                <Link
                  href={`/customer/orders/${order.id}`}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-brand-500 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/60 hover:border-brand-500 transition-all flex items-center space-x-1"
                >
                  <span>Track Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
