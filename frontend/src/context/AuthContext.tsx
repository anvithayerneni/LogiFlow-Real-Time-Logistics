"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "@/types";
import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; role: UserRole; phone?: string }) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = getAuthToken();
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        clearAuthToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string = "password123") => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      setUser(data.user);
      setAuthToken(data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ access_token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setToken(data.access_token);
      setUser(data.user);
      setAuthToken(data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthToken();
  };

  const quickSwitchRole = async (role: UserRole) => {
    const roleEmails: Record<UserRole, string> = {
      CUSTOMER: "emily@customer.com",
      RESTAURANT: "owner1@restaurant.com",
      DELIVERY_DRIVER: "driver1@driver.com",
      ADMIN: "admin@deliveryplatform.com",
    };
    await login(roleEmails[role], "password123");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
