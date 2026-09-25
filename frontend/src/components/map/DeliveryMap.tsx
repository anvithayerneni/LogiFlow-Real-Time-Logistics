"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryMapProps {
  pickupLat: number;
  pickupLon: number;
  dropoffLat: number;
  dropoffLon: number;
  driverLat?: number | null;
  driverLon?: number | null;
  restaurantName?: string;
  driverName?: string;
}

export default function DeliveryMap({
  pickupLat,
  pickupLon,
  dropoffLat,
  dropoffLon,
  driverLat,
  driverLon,
  restaurantName = "Restaurant",
  driverName = "Courier",
}: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([pickupLat, pickupLon], 13);

      // OpenStreetMap Dark/Carto Tile Layer for modern aesthetic
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Custom SVG icons
      const restaurantIcon = L.divIcon({
        className: "custom-pin",
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 bg-amber-500 text-white rounded-full shadow-lg border-2 border-slate-900">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const customerIcon = L.divIcon({
        className: "custom-pin",
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full shadow-lg border-2 border-slate-900">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Markers
      L.marker([pickupLat, pickupLon], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`<b>${restaurantName}</b><br>Pickup Location`);

      L.marker([dropoffLat, dropoffLon], { icon: customerIcon })
        .addTo(map)
        .bindPopup("<b>Delivery Destination</b>");

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update or add driver marker
    if (driverLat != null && driverLon != null) {
      const driverIcon = L.divIcon({
        className: "custom-driver-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-12 w-12 rounded-full bg-brand-400 opacity-75 animate-ping"></span>
            <div class="relative flex items-center justify-center w-10 h-10 bg-brand-600 text-white rounded-full shadow-xl border-2 border-slate-900">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLat, driverLon], { icon: driverIcon })
          .addTo(map)
          .bindPopup(`<b>${driverName}</b><br>On the way!`);
      } else {
        driverMarkerRef.current.setLatLng([driverLat, driverLon]);
      }

      // Draw polyline connecting Restaurant -> Driver -> Destination
      const routePoints: [number, number][] = [
        [pickupLat, pickupLon],
        [driverLat, driverLon],
        [dropoffLat, dropoffLon],
      ];

      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(routePoints);
      } else {
        routeLineRef.current = L.polyline(routePoints, {
          color: "#f97316",
          weight: 4,
          opacity: 0.8,
          dashArray: "8, 8",
        }).addTo(map);
      }

      // Fit bounds to show all 3 points
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Fit bounds for pickup and dropoff only
      const bounds = L.latLngBounds([
        [pickupLat, pickupLon],
        [dropoffLat, dropoffLon],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickupLat, pickupLon, dropoffLat, dropoffLon, driverLat, driverLon, restaurantName, driverName]);

  return (
    <div className="relative w-full h-[400px] lg:h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 shadow-lg flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Live GPS Stream</span>
      </div>
    </div>
  );
}
