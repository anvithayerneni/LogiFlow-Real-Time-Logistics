"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Store,
  User,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Delivery, Order, OrderStatus } from "@/types";

// Dynamically import Leaflet Map with SSR disabled for Next.js
const DeliveryMap = dynamic(() => import("@/components/map/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] lg:h-[480px] rounded-2xl bg-slate-900 animate-pulse border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
      Loading interactive logistics map...
    </div>
  ),
});

export default function OrderTrackingShowcasePage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  // 1. Fetch Order and Delivery
  const loadOrderAndDelivery = async () => {
    try {
      const orderData = await apiFetch<Order>(`/orders/${orderId}`);
      setOrder(orderData);

      try {
        const delivData = await apiFetch<Delivery>(`/deliveries/by-order/${orderId}`);
        setDelivery(delivData);
        if (delivData.driver?.current_latitude && delivData.driver?.current_longitude) {
          setDriverLocation({
            lat: delivData.driver.current_latitude,
            lon: delivData.driver.current_longitude,
          });
        }
      } catch {
        // Delivery might not be created yet if still preparing
      }
    } catch (err) {
      console.error("Error loading order", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadOrderAndDelivery();
  }, [orderId]);

  // 2. Establish WebSocket connection for real-time live telematics and status
  useEffect(() => {
    if (!delivery?.id) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";
    const socket = new WebSocket(`${wsUrl}/ws/deliveries/${delivery.id}`);

    socket.onopen = () => {
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "DRIVER_LOCATION_UPDATE") {
          setDriverLocation({
            lat: message.latitude,
            lon: message.longitude,
          });
        } else if (message.type === "DELIVERY_STATUS_CHANGED" || message.type === "ORDER_STATUS_CHANGED") {
          loadOrderAndDelivery();
        }
      } catch (err) {
        console.error("WebSocket message parse error", err);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [delivery?.id]);

  if (loading) {
    return <div className="py-24 text-center text-slate-500 animate-pulse">Connecting to live tracking satellite...</div>;
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Order not found</h2>
        <Link href="/customer/orders" className="text-brand-400 text-sm hover:underline">
          Back to my orders
        </Link>
      </div>
    );
  }

  // Stepper steps
  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: "CONFIRMED", label: "Confirmed", desc: "Order sent to kitchen" },
    { key: "PREPARING", label: "Preparing", desc: "Chef cooking your food" },
    { key: "READY_FOR_PICKUP", label: "Ready", desc: "Bagged for courier pickup" },
    { key: "OUT_FOR_DELIVERY", label: "On The Way", desc: "Courier en route to you" },
    { key: "DELIVERED", label: "Delivered", desc: "Enjoy your meal!" },
  ];

  const getStepStatus = (stepKey: OrderStatus) => {
    const orderProgression: Record<string, number> = {
      CREATED: 0,
      CONFIRMED: 1,
      PREPARING: 2,
      READY_FOR_PICKUP: 3,
      PICKED_UP: 4,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
      CANCELLED: -1,
      REJECTED: -1,
    };

    const currentRank = orderProgression[order.status] ?? 0;
    const stepRank = orderProgression[stepKey] ?? 0;

    if (order.status === "CANCELLED" || order.status === "REJECTED") return "cancelled";
    if (currentRank > stepRank) return "completed";
    if (currentRank === stepRank) return "current";
    return "upcoming";
  };

  const pickupLat = delivery?.pickup_latitude || 37.7989;
  const pickupLon = delivery?.pickup_longitude || -122.4075;
  const dropoffLat = delivery?.dropoff_latitude || 37.7952;
  const dropoffLon = delivery?.dropoff_longitude || -122.4029;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/customer/orders"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Orders</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tracking Order #{order.id.slice(0, 8)}
            </h1>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                order.status === "DELIVERED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : order.status === "CANCELLED" || order.status === "REJECTED"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-brand-500/10 text-brand-400 border-brand-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
              <span>{order.status.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* WebSocket Status Indicator */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
              wsConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
            ></span>
            <span>{wsConnected ? "WebSocket Connected" : "Connecting..."}</span>
          </div>

          <button
            onClick={loadOrderAndDelivery}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh order state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Estimated Delivery Time</h3>
            <p className="text-xs text-slate-400">Calculated via distance, speed, and kitchen prep</p>
          </div>
          <div className="flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 rounded-xl text-brand-400 text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>
              {order.estimated_delivery_time
                ? new Date(order.estimated_delivery_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "25-35 mins"}
            </span>
          </div>
        </div>

        {/* 5-Step Visual Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((s, idx) => {
            const status = getStepStatus(s.key);
            return (
              <div
                key={s.key}
                className={`relative p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                  status === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : status === "current"
                    ? "bg-brand-500/10 border-brand-500 text-brand-400 shadow-md shadow-brand-500/10"
                    : status === "cancelled"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wider opacity-70">
                    Step 0{idx + 1}
                  </span>
                  {status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="font-bold text-slate-200">{s.label}</div>
                <div className="text-[11px] opacity-80 leading-tight">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Showcase Interactive Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <MapPin className="w-4 h-4 text-brand-400" />
            <span>Real-Time Fleet Telemetry Map</span>
          </div>
          <span className="text-xs text-slate-500">Live GPS markers updated via Redis/Kafka streams</span>
        </div>

        <DeliveryMap
          pickupLat={pickupLat}
          pickupLon={pickupLon}
          dropoffLat={dropoffLat}
          dropoffLon={dropoffLon}
          driverLat={driverLocation?.lat}
          driverLon={driverLocation?.lon}
          restaurantName={order.restaurant_name || "Restaurant"}
          driverName={delivery?.driver?.full_name || "Courier"}
        />
      </div>

      {/* Driver Information Card & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Profile */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Bike className="w-4 h-4 text-sky-400" />
            <span>Assigned Delivery Driver</span>
          </h3>

          {delivery?.driver ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-base shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{delivery.driver.full_name || "Courier"}</h4>
                  <p className="text-xs text-slate-400">
                    Vehicle: {delivery.driver.vehicle_type?.toUpperCase()} • {delivery.driver.license_plate || "Verified"}
                  </p>
                  <p className="text-[11px] text-amber-400 font-semibold">★ {delivery.driver.rating || "5.0"} Rating</p>
                </div>
              </div>

              <a
                href={`tel:${delivery.driver.phone || "+15550199"}`}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Call driver"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              Kitchen is currently preparing food. An optimal courier will be automatically dispatched when ready.
            </div>
          )}
        </div>

        {/* Drop-off & Restaurant Info */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Store className="w-4 h-4 text-amber-400" />
            <span>Routing Coordinates</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-start space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5"></span>
              <div>
                <span className="font-bold text-slate-300">Pickup: </span>
                <span className="text-slate-400">{order.restaurant_name}</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5"></span>
              <div>
                <span className="font-bold text-slate-300">Destination: </span>
                <span className="text-slate-400">{order.customer_notes || "Customer delivery address"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Item Details Accordion */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-white">Order Details & Receipt</span>
            <span className="text-xs text-slate-400">({order.items?.length || 0} items)</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${accordionOpen ? "rotate-180" : ""}`}
          />
        </button>

        {accordionOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-4">
            <div className="divide-y divide-slate-800 text-xs">
              {order.items?.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between">
                  <span className="text-slate-300">
                    {item.quantity}x {item.item_name}
                  </span>
                  <span className="font-semibold text-white">${item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>${order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Paid</span>
                <span className="text-brand-400">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
