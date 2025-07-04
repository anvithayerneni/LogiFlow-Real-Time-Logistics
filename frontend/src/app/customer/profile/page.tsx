"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Plus, User as UserIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Address } from "@/types";

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("San Francisco");
  const [state, setState] = useState("CA");
  const [postalCode, setPostalCode] = useState("94105");
  const [label, setLabel] = useState("Office");
  const [adding, setAdding] = useState(false);

  const loadAddresses = async () => {
    try {
      const data = await apiFetch<Address[]>("/users/me/addresses");
      setAddresses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await apiFetch<Address>("/users/me/addresses", {
        method: "POST",
        body: JSON.stringify({
          label,
          street,
          city,
          state,
          postal_code: postalCode,
          latitude: 37.7850,
          longitude: -122.4050,
          is_default: false,
        }),
      });
      setStreet("");
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || "Failed to add address");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <UserIcon className="w-8 h-8 text-emerald-400" />
          <span>Customer Profile</span>
        </h1>
        <p className="text-xs text-slate-400">Manage account credentials and saved delivery addresses</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Account Details</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Full Name</span>
            <span className="font-semibold text-white">{user?.full_name || "Emily Watson"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Email</span>
            <span className="font-semibold text-white">{user?.email || "emily@customer.com"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Role</span>
            <span className="font-semibold text-brand-400">{user?.role || "CUSTOMER"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-brand-400" />
          <span>Saved Delivery Addresses</span>
        </h3>

        <div className="space-y-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white mr-2">{a.label}</span>
                <span className="text-slate-400">
                  {a.street}, {a.city}, {a.state} {a.postal_code}
                </span>
              </div>
              {a.is_default && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-bold text-[10px]">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddAddress} className="pt-4 border-t border-slate-800 space-y-3 text-xs">
          <h4 className="font-bold text-slate-200">Add New Destination</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Label (e.g. Work, Gym)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
            />
            <input
              type="text"
              required
              placeholder="Street Address"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50"
          >
            {adding ? "Saving..." : "Save Address"}
          </button>
        </form>
      </div>
    </div>
  );
}
