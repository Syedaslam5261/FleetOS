import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Crosshair, Loader2, Map as MapIcon } from 'lucide-react';
import { RouteLocation, RoutedPathResult } from '../../types/fuel';
import { formatDuration } from '../../services/routingService';

export interface MapWaypointMarker {
  key: string;
  role: 'start' | 'stop' | 'destination';
  stopIndex?: number;
  location: RouteLocation;
}

interface RoutePlannerMapProps {
  markers: MapWaypointMarker[];
  routes: RoutedPathResult[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (idx: number) => void;
  pickingLabel: string | null;
  onMapPick: (lat: number, lng: number) => void;
  onDragMarker: (marker: MapWaypointMarker, lat: number, lng: number) => void;
  isLoading: boolean;
  error: string | null;
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const makePinIcon = (text: string, bg: string) =>
  L.divIcon({
    className: 'fleetos-route-pin',
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${bg};color:#ffffff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 2px 8px rgba(15,23,42,0.38);cursor:grab;">${text}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export const RoutePlannerMap: React.FC<RoutePlannerMapProps> = ({
  markers,
  routes,
  selectedRouteIndex,
  onSelectRouteIndex,
  pickingLabel,
  onMapPick,
  onDragMarker,
  isLoading,
  error,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onMapPickRef = useRef(onMapPick);
  const pickingLabelRef = useRef(pickingLabel);

  useEffect(() => {
    onMapPickRef.current = onMapPick;
    pickingLabelRef.current = pickingLabel;
  }, [onMapPick, pickingLabel]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (pickingLabelRef.current) {
        onMapPickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      observer?.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update polylines & draggable markers
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const boundsCoords: L.LatLngExpression[] = [];

    // 1. Draw unselected alternative routes first (lighter slate, clickable)
    routes.forEach((rt, idx) => {
      if (idx === selectedRouteIndex || rt.coordinates.length < 2) return;
      const altLine = L.polyline(rt.coordinates, {
        color: '#64748b',
        weight: 4,
        opacity: 0.55,
        dashArray: '6 6',
      }).addTo(group);
      altLine.bindTooltip(
        `Alternative ${idx}: ${rt.distanceKm} km · Est. ${formatDuration(rt.durationSeconds)} (Click to select)`,
        { sticky: true }
      );
      altLine.on('click', () => onSelectRouteIndex(idx));
    });

    // 2. Draw selected route on top in bold FleetOS blue
    const activeRoute = routes[selectedRouteIndex];
    if (activeRoute && activeRoute.coordinates.length >= 2) {
      L.polyline(activeRoute.coordinates, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.92,
      }).addTo(group);
      activeRoute.coordinates.forEach((c) => boundsCoords.push(c));
    }

    // 3. Draw distinct draggable markers for Start, Intermediate Stops, Destination
    markers.forEach((m) => {
      const label =
        m.role === 'start' ? 'S' : m.role === 'destination' ? 'D' : String((m.stopIndex ?? 0) + 1);
      const bg =
        m.role === 'start' ? '#16a34a' : m.role === 'destination' ? '#dc2626' : '#0b1329';
      const title =
        m.role === 'start'
          ? 'Starting Location'
          : m.role === 'destination'
            ? 'Destination'
            : `Stop ${(m.stopIndex ?? 0) + 1}`;

      const marker = L.marker([m.location.lat, m.location.lng], {
        icon: makePinIcon(label, bg),
        draggable: true,
        zIndexOffset: m.role === 'stop' ? 300 : 500,
      })
        .bindPopup(
          `<div style="font-size:12px;"><strong>${title}</strong><br/>${m.location.shortName}<br/><span style="color:#64748b;font-size:11px;">Drag pin to adjust on map</span></div>`
        )
        .addTo(group);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onDragMarker(m, pos.lat, pos.lng);
      });

      boundsCoords.push([m.location.lat, m.location.lng]);
    });

    if (boundsCoords.length === 1) {
      map.setView(boundsCoords[0], 11);
    } else if (boundsCoords.length >= 2) {
      map.fitBounds(L.latLngBounds(boundsCoords), { padding: [40, 40], maxZoom: 13 });
    } else {
      map.setView(INDIA_CENTER, 5);
    }
  }, [markers, routes, selectedRouteIndex, onSelectRouteIndex, onDragMarker]);

  const activeRoute = routes[selectedRouteIndex] ?? null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Route Map (OpenStreetMap + OSRM)
          </h3>
        </div>
        {activeRoute && !isLoading && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono font-bold text-blue-700">
              {activeRoute.distanceKm.toLocaleString('en-IN')} km
            </span>
            <span className="font-semibold text-slate-600">
              Est. {formatDuration(activeRoute.durationSeconds)}
            </span>
          </div>
        )}
      </div>

      {pickingLabel && (
        <div className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800">
          <Crosshair className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span>Click anywhere on the map to set: {pickingLabel}</span>
        </div>
      )}

      <div className={`relative h-[380px] sm:h-[460px] w-full ${pickingLabel ? 'cursor-crosshair' : ''}`}>
        <div ref={containerRef} className="h-full w-full z-0" />

        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Calculating actual road route via OSRM...
            </div>
          </div>
        )}

        {!isLoading && !activeRoute && !error && markers.length < 2 && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center">
            <span className="rounded-lg border border-slate-200 bg-white/95 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
              Enter a starting location and destination, then click &ldquo;Calculate Route&rdquo;.
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
