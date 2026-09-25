"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Plus, ShoppingBag, Star } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { MenuItem, Restaurant } from "@/types";

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, itemCount, total } = useCart();

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const data = await apiFetch<Restaurant>(`/restaurants/${restaurantId}`);
        setRestaurant(data);
      } catch (err) {
        console.error("Failed to fetch restaurant", err);
      } finally {
        setLoading(false);
      }
    }
    if (restaurantId) loadRestaurant();
  }, [restaurantId]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 animate-pulse">Loading menu catalog...</div>;
  }

  if (!restaurant) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Restaurant not found</h2>
        <Link href="/customer/restaurants" className="text-brand-400 text-sm hover:underline">
          Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Back button */}
      <Link
        href="/customer/restaurants"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all restaurants</span>
      </Link>

      {/* Restaurant Hero Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="h-64 sm:h-72 w-full bg-slate-800 relative">
          <img
            src={
              restaurant.image_url ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80"
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-500 text-white uppercase tracking-wider">
                {restaurant.cuisine_type}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {restaurant.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2">
                {restaurant.description}
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/60 shadow-xl">
              <div className="flex items-center space-x-1 text-amber-400 text-sm font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{restaurant.rating.toFixed(1)}</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center space-x-1 text-slate-300 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>~{restaurant.prep_time_minutes} min prep</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{restaurant.address}</span>
        </div>
      </div>

      {/* Menu Catalog */}
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Menu Items</h2>
          <p className="text-xs text-slate-400">Handcrafted delicacies cooked fresh to order</p>
        </div>

        {restaurant.categories && restaurant.categories.length > 0 ? (
          restaurant.categories.map((category) => (
            <div key={category.id} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
                {category.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all shadow-md group"
                  >
                    <div className="space-y-1 pr-4">
                      <h4 className="font-semibold text-sm text-white group-hover:text-brand-400 transition-colors">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                      )}
                      <div className="pt-1 text-sm font-bold text-brand-400">${item.price.toFixed(2)}</div>
                    </div>

                    <button
                      onClick={() => addItem(item, restaurant)}
                      className="p-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white border border-brand-500/20 font-bold transition-all transform hover:scale-105"
                      title="Add to cart"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurant.menu_items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all shadow-md group"
              >
                <div className="space-y-1 pr-4">
                  <h4 className="font-semibold text-sm text-white group-hover:text-brand-400 transition-colors">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  )}
                  <div className="pt-1 text-sm font-bold text-brand-400">${item.price.toFixed(2)}</div>
                </div>

                <button
                  onClick={() => addItem(item, restaurant)}
                  className="p-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white border border-brand-500/20 font-bold transition-all transform hover:scale-105"
                  title="Add to cart"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-xl z-40 bg-slate-900/95 backdrop-blur-md border border-brand-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {itemCount}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Order from {restaurant.name}</div>
              <div className="text-base font-bold text-white">${total.toFixed(2)}</div>
            </div>
          </div>

          <Link
            href="/customer/cart"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-2"
          >
            <span>Proceed to Checkout</span>
            <ShoppingBag className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
