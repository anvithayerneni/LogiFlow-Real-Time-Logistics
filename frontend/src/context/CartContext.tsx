"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, MenuItem, Restaurant } from "@/types";

interface CartContextType {
  items: CartItem[];
  currentRestaurant: Restaurant | null;
  addItem: (menuItem: MenuItem, restaurant: Restaurant, instructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart");
      const storedRest = localStorage.getItem("cart_restaurant");
      if (stored) setItems(JSON.parse(stored));
      if (storedRest) setCurrentRestaurant(JSON.parse(storedRest));
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
      if (currentRestaurant) {
        localStorage.setItem("cart_restaurant", JSON.stringify(currentRestaurant));
      } else {
        localStorage.removeItem("cart_restaurant");
      }
    } catch {
      // Ignore storage errors
    }
  }, [items, currentRestaurant]);

  const addItem = (menuItem: MenuItem, restaurant: Restaurant, instructions?: string) => {
    // If adding from a different restaurant, prompt/clear previous restaurant items
    if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
      if (!confirm(`Clear your cart from ${currentRestaurant.name} and start an order with ${restaurant.name}?`)) {
        return;
      }
      setItems([{ menuItem, quantity: 1, specialInstructions: instructions }]);
      setCurrentRestaurant(restaurant);
      return;
    }

    setCurrentRestaurant(restaurant);
    setItems((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, specialInstructions: instructions || item.specialInstructions }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1, specialInstructions: instructions }];
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.menuItem.id !== menuItemId);
      if (next.length === 0) setCurrentRestaurant(null);
      return next;
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCurrentRestaurant(null);
    localStorage.removeItem("cart");
    localStorage.removeItem("cart_restaurant");
  };

  const subtotal = items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 3.49 : 0;
  const tax = items.length > 0 ? subtotal * 0.0825 : 0;
  const total = subtotal + deliveryFee + tax;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        currentRestaurant,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
