"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Shield, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { User } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<User[]>("/admin/users");
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "RESTAURANT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "DELIVERY_DRIVER":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

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
            <Users className="w-6 h-6 text-purple-400" />
            <span>User Accounts & RBAC Directory</span>
          </h1>
        </div>

        <button
          onClick={loadUsers}
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
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white">{u.full_name}</td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{u.phone || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-emerald-400 font-medium">Active</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-right">
                    {new Date(u.created_at).toLocaleDateString()}
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
