"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  MapPin,
  Navigation,
  Play,
  RotateCcw,
  Square,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Delivery, DeliveryStatus } from "@/types";

const DeliveryMap = dynamic(() => import("@/components/map/DeliveryMap"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-slate-900 animate-pulse" />,
});

export default function DriverActiveDeliveryConsole() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [currentLat, setCurrentLat] = useState<number>(37.7989);
  const [currentLon, setCurrentLon] = useState<number>(-122.4075);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const loadDelivery = async () => {
    try {
      const data = await apiFetch<Delivery>(`/deliveries/${deliveryId}`);
      setDelivery(data);
      if (data.driver?.current_latitude && data.driver?.current_longitude) {
        setCurrentLat(data.driver.current_latitude);
        setCurrentLon(data.driver.current_longitude);
      } else {
        setCurrentLat(data.pickup_latitude);
        setCurrentLon(data.pickup_longitude);
      }
    } catch (err) {
      console.error("Failed to load delivery", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryId) loadDelivery();
  }, [deliveryId]);

  const updateDeliveryStatus = async (nextStatus: DeliveryStatus) => {
    try {
      if (nextStatus === "ACCEPTED") {
        await apiFetch(`/deliveries/${deliveryId}/accept`, { method: "POST" });
      } else {
        await apiFetch(`/deliveries/${deliveryId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
      }
      await loadDelivery();
    } catch (err: any) {
      alert(err.message || "Failed to update delivery status");
    }
  };

  // Telemetry Location Push
  const sendLocationTelemetry = async (lat: number, lon: number) => {
    try {
      await apiFetch("/drivers/location", {
        method: "POST",
        body: JSON.stringify({
          delivery_id: deliveryId,
          latitude: lat,
          longitude: lon,
          speed: 34.5,
          heading: 65.0,
        }),
      });
      setCurrentLat(lat);
      setCurrentLon(lon);
    } catch (err) {
      console.error("Failed to send GPS telemetry", err);
    }
  };

  // Step towards customer dropoff
  const stepTowardsDestination = () => {
    if (!delivery) return;
    const targetLat = delivery.dropoff_latitude;
    const targetLon = delivery.dropoff_longitude;

    const nextLat = currentLat + (targetLat - currentLat) * 0.25;
    const nextLon = currentLon + (targetLon - currentLon) * 0.25;
    sendLocationTelemetry(Number(nextLat.toFixed(6)), Number(nextLon.toFixed(6)));
  };

  // Continuous Auto-Drive Simulation
  useEffect(() => {
    let interval: any;
    if (simulating && delivery) {
      interval = setInterval(() => {
        const targetLat = delivery.dropoff_latitude;
        const targetLon = delivery.dropoff_longitude;
        const dist = Math.hypot(targetLat - currentLat, targetLon - currentLon);

        if (dist < 0.0005) {
          setSimulating(false);
        } else {
          stepTowardsDestination();
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [simulating, currentLat, currentLon, delivery]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 animate-pulse">Loading courier console...</div>;
  }

  if (!delivery) {
    return (
      <div className="py-20 text-center text-white">
        Delivery not found. <Link href="/driver/deliveries" className="text-brand-400">Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/driver/deliveries"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deliveries</span>
        </Link>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
          Status: {delivery.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Main Delivery Workflow Actions */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Order #{delivery.order_id.slice(0, 8)}
            </h2>
            <p className="text-xs text-slate-400">
              Restaurant: {delivery.order?.restaurant?.name || delivery.order?.restaurant_name || "Kitchen"}
            </p>
          </div>

          {/* Workflow Transitions */}
          <div className="flex flex-wrap gap-2">
            {delivery.status === "ASSIGNED" && (
              <button
                onClick={() => updateDeliveryStatus("ACCEPTED")}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all"
              >
                Accept Delivery Job
              </button>
            )}

            {delivery.status === "ACCEPTED" && (
              <button
                onClick={() => updateDeliveryStatus("ARRIVED_AT_RESTAURANT")}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                Arrived at Restaurant
              </button>
            )}

            {delivery.status === "ARRIVED_AT_RESTAURANT" && (
              <button
                onClick={() => updateDeliveryStatus("PICKED_UP")}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg transition-all"
              >
                Confirm Food Picked Up
              </button>
            )}

            {delivery.status === "PICKED_UP" && (
              <button
                onClick={() => updateDeliveryStatus("IN_TRANSIT")}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg transition-all"
              >
                Start Transit to Customer
              </button>
            )}

            {delivery.status === "IN_TRANSIT" && (
              <button
                onClick={() => updateDeliveryStatus("DELIVERED")}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Delivered</span>
              </button>
            )}

            {delivery.status === "DELIVERED" && (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                Completed & Delivered
              </div>
            )}
          </div>
        </div>

        {/* Live GPS Telemetry Simulator Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-400">
              <Zap className="w-4 h-4" />
              <span>Real-Time GPS Vehicle Simulator</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              GPS: {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Emit real GPS telemetry events into Redis and Kafka to test live marker motion on the customer tracking page.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={stepTowardsDestination}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-brand-400" />
              <span>Step 25% Closer</span>
            </button>

            <button
              onClick={() => setSimulating(!simulating)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                simulating
                  ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                  : "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20"
              }`}
            >
              {simulating ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Auto-Drive</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Auto-Drive</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                sendLocationTelemetry(delivery.pickup_latitude, delivery.pickup_longitude)
              }
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition-colors"
              title="Reset position to restaurant"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Route Map */}
        <DeliveryMap
          pickupLat={delivery.pickup_latitude}
          pickupLon={delivery.pickup_longitude}
          dropoffLat={delivery.dropoff_latitude}
          dropoffLon={delivery.dropoff_longitude}
          driverLat={currentLat}
          driverLon={currentLon}
          restaurantName={delivery.order?.restaurant?.name || "Pickup"}
          driverName="Your Vehicle"
        />
      </div>
    </div>
  );
}
