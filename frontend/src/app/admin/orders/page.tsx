"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Order } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>("/admin/orders");
      setOrders(data);
    } catch (err) {
      console.error("Failed to load admin orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Admin Overview</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-brand-400" />
            <span>Platform Orders Master Roster</span>
          </h1>
        </div>

        <button
          onClick={loadOrders}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Restaurant</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-white">#{o.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5 font-medium">{o.customer_name || o.customer_id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5 text-slate-300">{o.restaurant_name || "Restaurant"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-200">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-brand-400">${o.total_amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/customer/orders/${o.id}`}
                      className="text-xs font-semibold text-brand-400 hover:underline inline-flex items-center space-x-1"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
