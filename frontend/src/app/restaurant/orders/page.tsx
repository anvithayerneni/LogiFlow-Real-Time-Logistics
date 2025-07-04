"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ChefHat, Check, Clock, Flame, PackageCheck, RefreshCw, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@/types";

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>("/orders");
      setOrders(data);
    } catch (err) {
      console.error("Failed to load restaurant orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setProcessingId(orderId);
    try {
      await apiFetch<Order>(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    } finally {
      setProcessingId(null);
    }
  };

  const activeOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <ChefHat className="w-8 h-8 text-amber-400" />
            <span>Kitchen Order Tickets</span>
          </h1>
          <p className="text-xs text-slate-400">Manage incoming orders, preparation phases, and driver dispatch</p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Active Orders Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span>Active Kitchen Queue</span>
          <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold">
            {activeOrders.length}
          </span>
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No active orders in the kitchen. All tickets cleared!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="font-bold text-white text-base">#{order.id.slice(0, 8)}</div>
                      <div className="text-xs text-slate-400">{order.customer_name || "Customer"}</div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="font-medium">
                          {item.quantity}x {item.item_name}
                        </span>
                        <span className="text-slate-400">${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.customer_notes && (
                    <div className="text-[11px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                      Note: &quot;{order.customer_notes}&quot;
                    </div>
                  )}
                </div>

                {/* State Machine Transition Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  {order.status === "CREATED" && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                        disabled={processingId === order.id}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Order</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, "REJECTED")}
                        disabled={processingId === order.id}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs transition-colors"
                        title="Reject Order"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "PREPARING")}
                      disabled={processingId === order.id}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Start Kitchen Prep</span>
                    </button>
                  )}

                  {order.status === "PREPARING" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "READY_FOR_PICKUP")}
                      disabled={processingId === order.id}
                      className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1 shadow-lg shadow-brand-500/20"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Food Ready (Dispatch Courier)</span>
                    </button>
                  )}

                  {["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status) && (
                    <div className="w-full text-center py-1.5 text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                      Dispatched to Courier • Awaiting drop-off
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders History */}
      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-bold text-slate-300">Completed Tickets History</h2>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 divide-y divide-slate-800 text-xs">
          {completedOrders.slice(0, 8).map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">#{order.id.slice(0, 8)}</span>
                <span className="text-slate-500 ml-2">
                  {order.items?.map((i) => `${i.quantity}x ${i.item_name}`).join(", ")}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-200">${order.total_amount.toFixed(2)}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    order.status === "DELIVERED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
