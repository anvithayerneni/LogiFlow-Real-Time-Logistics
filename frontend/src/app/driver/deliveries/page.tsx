"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bike, CheckCircle2, Clock, MapPin, Navigation, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Delivery, Driver } from "@/types";

export default function DriverDeliveriesPage() {
  const { user } = useAuth();
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<"assigned" | "available">("assigned");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const prof = await apiFetch<Driver>("/drivers/me");
        setDriverProfile(prof);
      } catch {
        // May not have driver profile if admin
      }

      // My assigned deliveries
      const myDeliveries = await apiFetch<Delivery[]>("/deliveries");
      setDeliveries(myDeliveries);

      // Open unassigned jobs
      const openJobs = await apiFetch<Delivery[]>("/deliveries?available=true");
      setAvailableJobs(openJobs);
    } catch (err) {
      console.error("Failed to load driver data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const toggleAvailability = async () => {
    if (!driverProfile) return;
    try {
      const updated = await apiFetch<Driver>(
        `/drivers/me/availability?is_available=${!driverProfile.is_available}`,
        { method: "PATCH" }
      );
      setDriverProfile(updated);
    } catch (err: any) {
      alert(err.message || "Failed to update availability");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Driver Status Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-md">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {driverProfile?.full_name || user?.full_name || "Courier"}
            </h1>
            <p className="text-xs text-slate-400">
              Vehicle: {driverProfile?.vehicle_type?.toUpperCase() || "CAR"} • {driverProfile?.license_plate || "Verified"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 ${
              driverProfile?.is_available
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                driverProfile?.is_available ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span>{driverProfile?.is_available ? "Available for Jobs" : "Offline / Busy"}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "assigned"
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          My Deliveries ({deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "available"
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          Open Dispatch Board ({availableJobs.length})
        </button>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : activeTab === "assigned" ? (
        deliveries.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No active deliveries assigned right now. Check the Open Dispatch Board!
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-white text-base">
                      {delivery.order?.restaurant?.name || "Restaurant Order"}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {delivery.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Est. Distance: {delivery.distance_km.toFixed(1)} km</span>
                    </div>
                    <div className="text-slate-500">
                      Order ID #{delivery.order_id.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/driver/deliveries/${delivery.id}`}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center space-x-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open Courier Cockpit</span>
                </Link>
              </div>
            ))}
          </div>
        )
      ) : availableJobs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          No unassigned orders waiting right now.
        </div>
      ) : (
        <div className="space-y-4">
          {availableJobs.map((delivery) => (
            <div
              key={delivery.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="font-bold text-white text-base">
                  {delivery.order?.restaurant?.name || "Restaurant Order"}
                </span>
                <div className="text-xs text-slate-400">
                  Approx distance: {delivery.distance_km.toFixed(1)} km
                </div>
              </div>

              <Link
                href={`/driver/deliveries/${delivery.id}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1"
              >
                <span>Accept Delivery Job</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
