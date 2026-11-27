import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoPoint, GpsTelemetryPoint, JourneyStopRecord } from '../../types/gpsTracking';

interface LiveJourneyMapProps {
  startLocation: GeoPoint;
  destination: GeoPoint;
  latestPoint?: GpsTelemetryPoint;
  travelledCoords: Array<[number, number]>;
  remainingCoords: Array<[number, number]>;
  stops: JourneyStopRecord[];
  onSelectStop: (stop: JourneyStopRecord) => void;
}

const makeDivIcon = (html: string, size: [number, number] = [32, 32]) =>
  L.divIcon({
    className: 'fleetos-gps-marker',
    html,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });

export const LiveJourneyMap: React.FC<LiveJourneyMapProps> = ({
  startLocation,
  destination,
  latestPoint,
  travelledCoords,
  remainingCoords,
  stops,
  onSelectStop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [startLocation.lat, startLocation.lng],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [
      [startLocation.lat, startLocation.lng],
      [destination.lat, destination.lng],
    ];

    // 1. Travelled Route — Solid dark navy polyline
    if (travelledCoords.length >= 2) {
      L.polyline(travelledCoords, {
        color: '#0b1329',
        weight: 5,
        opacity: 0.92,
      }).addTo(group);
      travelledCoords.forEach((pt) => boundsPoints.push(pt));
    }

    // 2. Remaining Route — Dashed blue polyline (clearly distinct style)
    if (remainingCoords.length >= 2) {
      L.polyline(remainingCoords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 8',
      }).addTo(group);
      remainingCoords.forEach((pt) => boundsPoints.push(pt));
    }

    // 3. Green Start Marker
    const startIcon = makeDivIcon(
      `<div style="width:28px;height:28px;border-radius:9999px;background:#16a34a;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">S</div>`,
      [28, 28]
    );
    L.marker([startLocation.lat, startLocation.lng], { icon: startIcon })
      .bindTooltip(`Start: ${startLocation.name}`, { direction: 'top' })
      .addTo(group);

    // 4. Destination Marker
    const destIcon = makeDivIcon(
      `<div style="width:28px;height:28px;border-radius:8px;background:#0b1329;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">D</div>`,
      [28, 28]
    );
    L.marker([destination.lat, destination.lng], { icon: destIcon })
      .bindTooltip(`Destination: ${destination.name}`, { direction: 'top' })
      .addTo(group);

    // 5. RED Stop Markers (clickable to open full stop details)
    stops.forEach((stop, idx) => {
      boundsPoints.push([stop.lat, stop.lng]);
      const stopIcon = makeDivIcon(
        `<div style="width:26px;height:26px;border-radius:9999px;background:#dc2626;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px;cursor:pointer;">${idx + 1}</div>`,
        [26, 26]
      );
      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon, zIndexOffset: 400 });
      marker.bindTooltip(
        `Stop (${stop.durationMinutes} min · ${stop.status}): ${stop.locationLabel} — Click for details`,
        { direction: 'top' }
      );
      marker.on('click', () => onSelectStop(stop));
      marker.addTo(group);
    });

    // 6. Latest Verified GPS Position — Truck Icon Marker
    if (latestPoint) {
      boundsPoints.push([latestPoint.lat, latestPoint.lng]);
      const truckIcon = makeDivIcon(
        `<div style="width:38px;height:38px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(37,99,235,0.55);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>`,
        [38, 38]
      );
      L.marker([latestPoint.lat, latestPoint.lng], { icon: truckIcon, zIndexOffset: 600 })
        .bindTooltip(
          `Latest GPS: ${latestPoint.areaLabel ?? `${latestPoint.lat.toFixed(4)}, ${latestPoint.lng.toFixed(4)}`}`,
          { direction: 'top' }
        )
        .addTo(group);
    }

    if (boundsPoints.length >= 2) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [36, 36], maxZoom: 13 });
    }
  }, [startLocation, destination, latestPoint, travelledCoords, remainingCoords, stops, onSelectStop]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div ref={containerRef} className="h-[340px] sm:h-[420px] w-full z-0" />
    </div>
  );
};
