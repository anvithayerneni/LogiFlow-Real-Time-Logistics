"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bike,
  Building2,
  ChefHat,
  Cpu,
  Layers,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { quickSwitchRole } = useAuth();

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-16">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            <span>Event-Driven Microservices Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Real-Time Delivery &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-amber-400 to-orange-500">
              Logistics Platform
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            A high-concurrency DoorDash/Uber Eats-style delivery ecosystem demonstrating real-time
            GPS vehicle telemetry, Apache Kafka event streaming, Redis geospatial caching, strict finite
            state machines, and reactive WebSockets.
          </p>

          {/* Quick Start Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/customer/restaurants"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm shadow-xl shadow-brand-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore as Customer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-sm transition-all"
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Admin Telemetry Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Interactive Role Switcher Cards */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Role Experiences</h2>
          <p className="text-sm text-slate-400">
            Click any role to instantly log in and experience the platform from that user perspective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Customer */}
          <div
            onClick={() => quickSwitchRole("CUSTOMER")}
            className="group cursor-pointer rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 p-6 transition-all shadow-lg hover:shadow-emerald-500/10 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
              Customer Portal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Browse restaurant menus, cart calculations, place orders, and follow the live GPS tracking map.
            </p>
            <Link
              href="/customer/restaurants"
              className="text-xs font-semibold text-emerald-400 flex items-center space-x-1"
            >
              <span>Switch to Customer</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 2. Restaurant */}
          <div
            onClick={() => quickSwitchRole("RESTAURANT")}
            className="group cursor-pointer rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 p-6 transition-all shadow-lg hover:shadow-amber-500/10 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
              Kitchen Dispatch
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Live kitchen tickets, order confirmation, prep status updates, and dynamic menu catalog editing.
            </p>
            <Link
              href="/restaurant/orders"
              className="text-xs font-semibold text-amber-400 flex items-center space-x-1"
            >
              <span>Switch to Kitchen</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 3. Driver */}
          <div
            onClick={() => quickSwitchRole("DELIVERY_DRIVER")}
            className="group cursor-pointer rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 p-6 transition-all shadow-lg hover:shadow-sky-500/10 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bike className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">
              Courier Cockpit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Accept dispatched deliveries, update transit states, and simulate GPS telematics with breadcrumbs.
            </p>
            <Link
              href="/driver/deliveries"
              className="text-xs font-semibold text-sky-400 flex items-center space-x-1"
            >
              <span>Switch to Driver</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 4. Admin */}
          <div
            onClick={() => quickSwitchRole("ADMIN")}
            className="group cursor-pointer rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 p-6 transition-all shadow-lg hover:shadow-purple-500/10 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
              Operations Control
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Aggregate revenue analytics, real-time fleet delivery counts, platform health, and user rosters.
            </p>
            <Link
              href="/admin"
              className="text-xs font-semibold text-purple-400 flex items-center space-x-1"
            >
              <span>Switch to Admin</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Highlights Grid */}
      <section className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Engineering Highlights</h2>
          <p className="text-sm text-slate-400">Key architectural foundations powering the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-brand-400 font-semibold text-sm">
              <Zap className="w-4 h-4" />
              <span>Kafka Event-Driven Backbone</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decoupled microservices publish and subscribe to 12 distinct event streams including order status,
              automated driver dispatch, telemetry, and customer alerts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <Layers className="w-4 h-4" />
              <span>Sub-Second Redis Geocaching</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-memory geospatial index caches dynamic driver coordinates, broadcasting live location packets
              over WebSockets to tracking subscribers without straining PostgreSQL.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Finite State Machines</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guaranteed lifecycle invariants prevent invalid state anomalies (e.g., delivered orders reverting
              to prep, or unassigned deliveries transitioning to transit).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
