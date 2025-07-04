"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, KeyRound, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, quickSwitchRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/customer/restaurants");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await quickSwitchRole(role);
      if (role === "CUSTOMER") router.push("/customer/restaurants");
      else if (role === "RESTAURANT") router.push("/restaurant/orders");
      else if (role === "DELIVERY_DRIVER") router.push("/driver/deliveries");
      else if (role === "ADMIN") router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto shadow-md">
          <Bike className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to LogiFlow</h1>
        <p className="text-xs text-slate-400">Access your customer, restaurant, courier, or admin console</p>
      </div>

      {/* Instant Demo Role Selection */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400">
          <Sparkles className="w-4 h-4" />
          <span>One-Click Demo Portals</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleDemoLogin("CUSTOMER")}
            type="button"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 font-medium transition-all text-left"
          >
            🍔 Customer Demo
          </button>
          <button
            onClick={() => handleDemoLogin("RESTAURANT")}
            type="button"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 font-medium transition-all text-left"
          >
            🍕 Restaurant Demo
          </button>
          <button
            onClick={() => handleDemoLogin("DELIVERY_DRIVER")}
            type="button"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 font-medium transition-all text-left"
          >
            🛵 Courier Demo
          </button>
          <button
            onClick={() => handleDemoLogin("ADMIN")}
            type="button"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 font-medium transition-all text-left"
          >
            📊 Admin Demo
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 text-xs text-slate-500">
        <div className="flex-1 h-px bg-slate-800"></div>
        <span>or sign in with credentials</span>
        <div className="flex-1 h-px bg-slate-800"></div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emily@customer.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Password</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-semibold text-sm text-white shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand-400 font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
