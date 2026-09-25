"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  Building2,
  ChefHat,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Store,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { UserRole } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, quickSwitchRole } = useAuth();
  const { itemCount } = useCart();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: "CUSTOMER", label: "Customer (Emily)", icon: User, color: "text-emerald-400" },
    { role: "RESTAURANT", label: "Restaurant (Mario)", icon: ChefHat, color: "text-amber-400" },
    { role: "DELIVERY_DRIVER", label: "Courier (Marcus)", icon: Bike, color: "text-sky-400" },
    { role: "ADMIN", label: "Admin (Alex)", icon: Users, color: "text-purple-400" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-100 leading-none tracking-tight">LogiFlow</span>
                <span className="text-[10px] text-brand-400 font-medium tracking-wider uppercase mt-0.5">Real-Time Logistics</span>
              </div>
            </Link>

            {/* Role Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {user?.role === "CUSTOMER" && (
                <>
                  <Link
                    href="/customer/restaurants"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/customer/restaurants")
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Restaurants
                  </Link>
                  <Link
                    href="/customer/orders"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/customer/orders")
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    My Orders
                  </Link>
                </>
              )}

              {user?.role === "RESTAURANT" && (
                <>
                  <Link
                    href="/restaurant/orders"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/restaurant/orders")
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Kitchen Tickets
                  </Link>
                  <Link
                    href="/restaurant/menu"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/restaurant/menu")
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Menu Catalog
                  </Link>
                </>
              )}

              {user?.role === "DELIVERY_DRIVER" && (
                <>
                  <Link
                    href="/driver/deliveries"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/driver/deliveries")
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Dispatch & Deliveries
                  </Link>
                </>
              )}

              {user?.role === "ADMIN" && (
                <>
                  <Link
                    href="/admin"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/admin"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Overview
                  </Link>
                  <Link
                    href="/admin/orders"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/admin/orders"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/admin/deliveries"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/admin/deliveries"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Deliveries
                  </Link>
                  <Link
                    href="/admin/users"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/admin/users"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Demo Quick Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 shadow-sm transition-all"
                title="Switch Demo Role"
              >
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                <span>Role: {user ? user.role : "Guest"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Instant Demo Switcher
                  </div>
                  {roles.map(({ role, label, icon: Icon, color }) => (
                    <button
                      key={role}
                      onClick={() => {
                        quickSwitchRole(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800 ${
                        user?.role === role ? "bg-slate-800/80 text-white font-medium" : "text-slate-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Button (For Customers) */}
            <Link
              href="/customer/cart"
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Login/Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
                  {user.full_name}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
