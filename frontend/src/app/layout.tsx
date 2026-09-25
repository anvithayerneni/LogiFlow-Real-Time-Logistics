import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "LogiFlow | Real-Time Delivery & Logistics Platform",
  description:
    "Production-grade delivery logistics platform with real-time driver tracking, Kafka event streaming, and multi-tenant roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </main>
              <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
                <p>
                  LogiFlow • Real-Time Delivery & Logistics Platform • Event-Driven Microservices Portfolio Architecture
                </p>
              </footer>
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
