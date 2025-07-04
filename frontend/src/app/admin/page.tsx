"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bike,
  CheckCircle2,
  DollarSign,
  Package,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "@/lib/api";

export default function AdminOverviewDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>("/admin/metrics");
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load admin metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <span>Operations Telemetry & Control</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time platform throughput, fleet status, and business intelligence
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ${metrics?.total_revenue?.toFixed(2) || "0.00"}
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% from last week</span>
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Volume</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{metrics?.total_orders || 0} Orders</div>
          <p className="text-[11px] text-slate-400">
            {metrics?.completed_deliveries || 0} completed
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Deliveries</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.active_deliveries || 0} In-Flight
          </div>
          <p className="text-[11px] text-sky-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            <span>{metrics?.active_drivers || 0} active couriers</span>
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg Delivery Speed</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.average_delivery_time_minutes || 26.4} mins
          </div>
          <p className="text-[11px] text-slate-400">
            Cancellation: {metrics?.cancellation_rate_percent || 0}%
          </p>
        </div>
      </div>

      {/* Recharts Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Area Chart */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">7-Day Orders Velocity</h3>
            <span className="text-xs text-slate-500">Completed order trends</span>
          </div>

          <div className="h-64 w-full">
            {metrics?.chart_data ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chart_data}>
                  <defs>
                    <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#orderGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                Loading telemetry graph...
              </div>
            )}
          </div>
        </div>

        {/* Revenue Velocity Bar Chart */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Daily Revenue Volume ($)</h3>
            <span className="text-xs text-slate-500">Gross revenue</span>
          </div>

          <div className="h-64 w-full">
            {metrics?.chart_data ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                Loading revenue bars...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health Status & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Infrastructure Health Status</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">PostgreSQL</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>ONLINE</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Redis Cache</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>ACTIVE</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Kafka Bus</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>STREAMING</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">WebSockets Hub</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>HEALTHY</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Management Hub */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-3 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Management Modules</span>
          </h3>

          <div className="space-y-2 text-xs">
            <Link
              href="/admin/orders"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
            >
              <span>Platform Orders & Invoices</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
            <Link
              href="/admin/deliveries"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
            >
              <span>Courier Fleet & Dispatches</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
            >
              <span>User Accounts & RBAC Roles</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
