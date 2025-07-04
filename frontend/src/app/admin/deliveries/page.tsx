"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bike, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Delivery } from "@/types";

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Delivery[]>("/admin/deliveries");
      setDeliveries(data);
    } catch (err) {
      console.error("Failed to load admin deliveries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
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
            <Bike className="w-6 h-6 text-sky-400" />
            <span>Fleet Deliveries & Dispatches</span>
          </h1>
        </div>

        <button
          onClick={loadDeliveries}
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
                <th className="px-5 py-3.5">Delivery ID</th>
                <th className="px-5 py-3.5">Linked Order</th>
                <th className="px-5 py-3.5">Courier Driver</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Distance</th>
                <th className="px-5 py-3.5">Dispatch Time</th>
                <th className="px-5 py-3.5 text-right">Cockpit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-white">#{d.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">#{d.order_id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-200">
                      {d.driver?.full_name || "Unassigned"}
                    </span>
                    {d.driver?.vehicle_type && (
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {d.driver.vehicle_type}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-amber-400 font-bold">{d.distance_km.toFixed(1)} km</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/driver/deliveries/${d.id}`}
                      className="text-xs font-semibold text-sky-400 hover:underline inline-flex items-center space-x-1"
                    >
                      <span>Control</span>
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
