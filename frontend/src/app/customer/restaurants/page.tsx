"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, Search, Star, Utensils } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Restaurant } from "@/types";

export default function RestaurantListPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const cuisines = ["All", "Italian", "Japanese", "Mexican", "American", "Healthy & Organic"];

  useEffect(() => {
    async function loadRestaurants() {
      setLoading(true);
      try {
        let endpoint = "/restaurants";
        const params = new URLSearchParams();
        if (selectedCuisine !== "All") params.append("cuisine", selectedCuisine);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (params.toString()) endpoint += `?${params.toString()}`;

        const data = await apiFetch<Restaurant[]>(endpoint);
        setRestaurants(data);
      } catch (err) {
        console.error("Failed to load restaurants", err);
      } finally {
        setLoading(false);
      }
    }
    loadRestaurants();
  }, [selectedCuisine, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Available Restaurants</h1>
          <p className="text-sm text-slate-400">Order from the finest local kitchens with live GPS dispatch</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search pizza, ramen, tacos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Cuisine Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCuisine(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCuisine === c
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800/60" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No restaurants found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters or search keywords</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/customer/restaurants/${restaurant.id}`}
              className="group block rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-brand-500/50 overflow-hidden shadow-lg hover:shadow-brand-500/10 transition-all transform hover:-translate-y-1"
            >
              {/* Image banner */}
              <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                <img
                  src={
                    restaurant.image_url ||
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80"
                  }
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-bold text-amber-400 flex items-center space-x-1 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-lg text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                    {restaurant.name}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    {restaurant.cuisine_type}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {restaurant.description || "Fresh and handcrafted dishes prepared on order."}
                </p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    <span>{restaurant.prep_time_minutes} min prep</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400 line-clamp-1 max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
