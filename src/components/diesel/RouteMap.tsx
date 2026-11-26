import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Loader2, Map as MapIcon } from 'lucide-react';
import { RouteLocation, RoutedPathResult } from '../../types/fuel';
import { formatDuration } from '../../services/routingService';

interface RouteMapProps {
  waypoints: RouteLocation[];
  route: RoutedPathResult | null;
  isLoading: boolean;
  error: string | null;
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const makeBadgeIcon = (text: string, bg: string) =>
  L.divIcon({
    className: 'fleetos-map-pin',
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:${bg};color:#ffffff;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(15,23,42,0.35);">${text}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

export const RouteMap: React.FC<RouteMapProps> = ({ waypoints, route, isLoading, error }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update markers and OSRM road polyline when waypoints/route change
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (route && route.coordinates.length > 0) {
      const polyline = L.polyline(route.coordinates, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.9,
      }).addTo(group);

      waypoints.forEach((wp, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === waypoints.length - 1;
        const label = isStart ? 'A' : isEnd ? 'B' : String(idx);
        const bg = isStart ? '#059669' : isEnd ? '#dc2626' : '#0b1329';
        L.marker([wp.lat, wp.lng], { icon: makeBadgeIcon(label, bg) })
          .bindPopup(`<strong>${isStart ? 'Start' : isEnd ? 'Destination' : `Stop ${idx}`}</strong><br/>${wp.shortName}`)
          .addTo(group);
      });

      map.fitBounds(polyline.getBounds(), { padding: [36, 36] });
    } else if (waypoints.length > 0) {
      const bounds: L.LatLngExpression[] = [];
      waypoints.forEach((wp, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === waypoints.length - 1 && waypoints.length > 1;
        const label = isStart ? 'A' : isEnd ? 'B' : String(idx);
        const bg = isStart ? '#059669' : isEnd ? '#dc2626' : '#0b1329';
        L.marker([wp.lat, wp.lng], { icon: makeBadgeIcon(label, bg) })
          .bindPopup(wp.shortName)
          .addTo(group);
        bounds.push([wp.lat, wp.lng]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 11);
      } else {
        map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36] });
      }
    } else {
      map.setView(INDIA_CENTER, 5);
    }
  }, [waypoints, route]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Route Map (OpenStreetMap + OSRM)
          </h4>
        </div>
        {route && !isLoading && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-700">
              {route.distanceKm.toLocaleString('en-IN')} km
            </span>
            <span className="text-slate-500">{formatDuration(route.durationSeconds)}</span>
          </div>
        )}
      </div>

      <div className="relative h-72 w-full sm:h-80">
        <div ref={containerRef} className="h-full w-full z-0" />

        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Calculating road route via OSRM...
            </div>
          </div>
        )}

        {!isLoading && !route && !error && waypoints.length < 2 && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center">
            <span className="rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
              Select a starting location and final destination to calculate the actual road route.
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 border-t border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
