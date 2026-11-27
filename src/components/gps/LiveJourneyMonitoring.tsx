import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Gauge,
  History,
  MapPin,
  Navigation,
  Power,
  Radio,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import {
  EngineVehicleStatus,
  GpsConnectionStatus,
  JourneyStopRecord,
} from '../../types/gpsTracking';
import { GpsTrackingService } from '../../services/gpsTrackingService';
import {
  fetchRoadRoute,
  formatDuration,
  reverseGeocodeLocation,
} from '../../services/routingService';
import {
  calculateTrackedDistanceKm,
  classifyGpsConnection,
  deriveEngineVehicleStatus,
  detectStopsFromHistory,
  formatStopDuration,
  generateJourneyAlerts,
} from '../../utils/gpsJourneyEngine';
import { LiveJourneyMap } from './LiveJourneyMap';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatDate } from '../../utils/formatters';

interface LiveJourneyMonitoringProps {
  lorry: Lorry;
}

const GPS_BADGE: Record<GpsConnectionStatus, string> = {
  LIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  STALE: 'border-amber-200 bg-amber-50 text-amber-800',
  OFFLINE: 'border-red-200 bg-red-50 text-red-700',
  UNAVAILABLE: 'border-slate-200 bg-slate-100 text-slate-600',
};

const ENGINE_BADGE: Record<EngineVehicleStatus, string> = {
  'Engine Running': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'Engine OFF': 'border-red-200 bg-red-50 text-red-700',
  'Vehicle Stationary': 'border-amber-200 bg-amber-50 text-amber-800',
  'GPS Offline': 'border-red-200 bg-red-50 text-red-700',
  'GPS Unavailable': 'border-slate-200 bg-slate-100 text-slate-600',
};

export const LiveJourneyMonitoring: React.FC<LiveJourneyMonitoringProps> = ({ lorry }) => {
  const [tick, setTick] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedStop, setSelectedStop] = useState<JourneyStopRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Live OSRM road route segments (Travelled vs Remaining) + Reverse Geocoded Area
  const [travelledRoadCoords, setTravelledRoadCoords] = useState<Array<[number, number]>>([]);
  const [travelledRoadKm, setTravelledRoadKm] = useState<number | null>(null);
  const [remainingRoadCoords, setRemainingRoadCoords] = useState<Array<[number, number]>>([]);
  const [remainingRoadKm, setRemainingRoadKm] = useState<number | null>(null);
  const [remainingDurationSec, setRemainingDurationSec] = useState<number | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const [resolvedCurrentArea, setResolvedCurrentArea] = useState<string | null>(null);
  const [resolvedStopAreas, setResolvedStopAreas] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = GpsTrackingService.subscribe(() => {
      setTick((t) => t + 1);
      setNowMs(Date.now());
    });
    return unsub;
  }, []);

  const journey = useMemo(() => GpsTrackingService.getJourney(lorry.id), [lorry.id, tick]);

  const sortedPoints = useMemo(() => {
    if (!journey) return [];
    return [...journey.points].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }, [journey]);

  const latestPoint = sortedPoints.length > 0 ? sortedPoints[sortedPoints.length - 1] : undefined;

  const { status: gpsStatus, ageMinutes } = useMemo(
    () => classifyGpsConnection(journey, nowMs),
    [journey, nowMs]
  );

  const engineInfo = useMemo(
    () => deriveEngineVehicleStatus(gpsStatus, latestPoint),
    [gpsStatus, latestPoint]
  );

  const rawStops = useMemo(() => {
    if (!journey) return [];
    return detectStopsFromHistory(
      sortedPoints,
      journey.minStopDurationMinutes,
      journey.longStopAlertMinutes,
      nowMs
    );
  }, [journey, sortedPoints, nowMs]);

  const stops = useMemo(
    () =>
      rawStops.map((s) => ({
        ...s,
        locationLabel: resolvedStopAreas[s.id] ?? s.locationLabel,
      })),
    [rawStops, resolvedStopAreas]
  );

  const alerts = useMemo(
    () =>
      generateJourneyAlerts(
        journey,
        gpsStatus,
        ageMinutes,
        latestPoint,
        stops,
        new Date(nowMs).toISOString()
      ),
    [journey, gpsStatus, ageMinutes, latestPoint, stops, nowMs]
  );

  const gpsTrackedKm = useMemo(() => calculateTrackedDistanceKm(sortedPoints), [sortedPoints]);

  // Fetch actual road route via OSRM whenever latest verified GPS point updates
  useEffect(() => {
    if (!journey || !latestPoint) {
      setTravelledRoadCoords([]);
      setRemainingRoadCoords([]);
      setTravelledRoadKm(null);
      setRemainingRoadKm(null);
      setRemainingDurationSec(null);
      return;
    }

    const controller = new AbortController();
    setIsRouting(true);
    setRoutingError(null);

    const run = async () => {
      try {
        // Segment 1: Start -> Latest Verified GPS (for road-aligned travelled display)
        const travelledRes = await fetchRoadRoute(
          [
            {
              label: journey.startLocation.name,
              shortName: journey.startLocation.name,
              lat: journey.startLocation.lat,
              lng: journey.startLocation.lng,
            },
            {
              label: 'Latest GPS',
              shortName: 'Latest GPS',
              lat: latestPoint.lat,
              lng: latestPoint.lng,
            },
          ],
          controller.signal
        );

        // Segment 2: Latest Verified GPS -> Destination (remaining road distance & ETA estimate)
        const remainingRes = await fetchRoadRoute(
          [
            {
              label: 'Latest GPS',
              shortName: 'Latest GPS',
              lat: latestPoint.lat,
              lng: latestPoint.lng,
            },
            {
              label: journey.destination.name,
              shortName: journey.destination.name,
              lat: journey.destination.lat,
              lng: journey.destination.lng,
            },
          ],
          controller.signal
        );

        if (!controller.signal.aborted) {
          setTravelledRoadCoords(travelledRes.coordinates);
          setTravelledRoadKm(travelledRes.distanceKm);
          setRemainingRoadCoords(remainingRes.coordinates);
          setRemainingRoadKm(remainingRes.distanceKm);
          setRemainingDurationSec(remainingRes.durationSeconds);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setRoutingError(
            err instanceof Error ? err.message : 'Unable to fetch OSRM road route.'
          );
          // Fallback strictly to verified GPS coordinate polyline (never inventing road distances)
          setTravelledRoadCoords(sortedPoints.map((p) => [p.lat, p.lng]));
          setRemainingRoadCoords([
            [latestPoint.lat, latestPoint.lng],
            [journey.destination.lat, journey.destination.lng],
          ]);
        }
      } finally {
        if (!controller.signal.aborted) setIsRouting(false);
      }
    };

    run();
    return () => controller.abort();
  }, [journey?.lorryId, journey?.tripId, latestPoint?.id]);

  // Reverse geocode latest verified GPS coordinates + stop coordinates via Nominatim
  useEffect(() => {
    if (!latestPoint) {
      setResolvedCurrentArea(null);
      return;
    }
    const controller = new AbortController();
    reverseGeocodeLocation(latestPoint.lat, latestPoint.lng, controller.signal)
      .then((area) => {
        if (!controller.signal.aborted) setResolvedCurrentArea(area);
      })
      .catch(() => {
        // Keep verified areaLabel / coordinates on rate-limit or offline
      });
    return () => controller.abort();
  }, [latestPoint?.id]);

  useEffect(() => {
    if (rawStops.length === 0) return;
    const controller = new AbortController();
    rawStops.forEach((s) => {
      if (resolvedStopAreas[s.id]) return;
      reverseGeocodeLocation(s.lat, s.lng, controller.signal)
        .then((area) => {
          if (!controller.signal.aborted) {
            setResolvedStopAreas((prev) => ({ ...prev, [s.id]: area }));
          }
        })
        .catch(() => {
          // Graceful fallback to existing label/coords
        });
    });
    return () => controller.abort();
  }, [rawStops.map((s) => s.id).join(',')]);

  // Empty / GPS Unavailable State (e.g. LR-007)
  if (!journey || !latestPoint) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Radio className="h-6 w-6" />
          </div>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-600">
            GPS Unavailable
          </span>
          <h2 className="mt-2 text-base font-bold text-slate-900">
            No Live GPS Telemetry for {lorry.registrationNumber}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            No GPS tracking device or active trip coordinates are linked to this lorry. FleetOS never invents truck positions, speeds, or engine states.
          </p>
        </div>
      </div>
    );
  }

  const travelledDistanceDisplay = travelledRoadKm ?? gpsTrackedKm;
  const totalTripDistanceDisplay =
    remainingRoadKm !== null
      ? Math.round((travelledDistanceDisplay + remainingRoadKm) * 10) / 10
      : null;

  const estimatedArrivalIso =
    remainingDurationSec !== null
      ? new Date(nowMs + remainingDurationSec * 1000).toISOString()
      : null;

  const currentAreaText =
    resolvedCurrentArea ||
    latestPoint.areaLabel ||
    `${latestPoint.lat.toFixed(4)}, ${latestPoint.lng.toFixed(4)}`;

  return (
    <div className="space-y-5">
      {/* Top Status Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#0b1329] px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                {journey.tripId}
              </span>
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase',
                  GPS_BADGE[gpsStatus]
                )}
              >
                <span
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    gpsStatus === 'LIVE'
                      ? 'bg-emerald-500'
                      : gpsStatus === 'STALE'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                />
                GPS {gpsStatus}
              </span>
              {journey.isDemoSeed && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  Demo Telemetry · Session Only
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {journey.startLocation.name} → {journey.destination.name}
            </h2>
            <p className="text-xs text-slate-500">
              Lorry <span className="font-mono font-semibold text-slate-800">{lorry.registrationNumber}</span> · Device:{' '}
              <span className="font-mono">{journey.deviceId ?? 'Unassigned'}</span> · Current Area:{' '}
              <span className="font-semibold text-slate-800">{currentAreaText}</span>
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={clsx('h-4 w-4', isRouting && 'animate-spin')} />}
            onClick={() => setNowMs(Date.now())}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {/* E. Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={clsx(
                'flex items-start gap-3 rounded-xl border px-4 py-3 text-xs',
                al.severity === 'critical'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              )}
            >
              <ShieldAlert
                className={clsx(
                  'mt-0.5 h-4 w-4 flex-shrink-0',
                  al.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{al.title}</p>
                <p className="mt-0.5">{al.message}</p>
              </div>
              <span className="hidden sm:inline whitespace-nowrap text-[11px] opacity-80">
                {formatDate(al.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* A. Live Journey Map + Legend */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-blue-600" />
            Live Journey Map
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Start
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Truck GPS
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Stop (click)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-[#0b1329]" /> Travelled
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-blue-600" /> Remaining (Est.)
            </span>
          </div>
        </div>

        <LiveJourneyMap
          startLocation={journey.startLocation}
          destination={journey.destination}
          latestPoint={latestPoint}
          travelledCoords={
            travelledRoadCoords.length >= 2
              ? travelledRoadCoords
              : sortedPoints.map((p) => [p.lat, p.lng])
          }
          remainingCoords={remainingRoadCoords}
          stops={stops}
          onSelectStop={setSelectedStop}
        />

        {routingError && (
          <p className="text-[11px] text-amber-700">
            Road routing service unavailable ({routingError}). Showing verified GPS points directly.
          </p>
        )}
      </div>

      {/* B. Live Journey Information Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Total Trip Distance</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900">
            {totalTripDistanceDisplay !== null ? `${totalTripDistanceDisplay} km` : 'Calculating...'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Travelled + Remaining road</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Distance Travelled</p>
          <p className="mt-1 font-mono text-lg font-bold text-[#0b1329]">
            {travelledDistanceDisplay} km
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            GPS-tracked path: {gpsTrackedKm} km
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Remaining Road Distance</p>
          <p className="mt-1 font-mono text-lg font-bold text-blue-700">
            {remainingRoadKm !== null ? `${remainingRoadKm} km` : 'Unavailable'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">OSRM road estimate</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Est. Time &amp; Arrival (Estimate)
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900">
            {remainingDurationSec !== null ? formatDuration(remainingDurationSec) : 'Unavailable'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {estimatedArrivalIso ? `ETA (Est.): ${formatDate(estimatedArrivalIso)}` : 'Awaiting route'}
          </p>
        </div>
      </div>

      {/* C. Engine & Vehicle Status + Speed & Last GPS Update */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Power className="h-4 w-4 text-blue-600" />
              Engine &amp; Vehicle Status
            </h3>
            <span
              className={clsx(
                'rounded-full border px-2.5 py-0.5 text-xs font-bold',
                ENGINE_BADGE[engineInfo.status]
              )}
            >
              {engineInfo.status}
            </span>
          </div>
          <p className="text-xs text-slate-600">{engineInfo.detailNote}</p>
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Ignition Telemetry</p>
              <p className="mt-0.5 font-bold text-slate-900">
                {latestPoint.ignition === 'UNAVAILABLE'
                  ? 'Unavailable (Not assumed)'
                  : `Ignition ${latestPoint.ignition}`}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" /> Current Speed
              </p>
              <p className="mt-0.5 font-mono font-bold text-slate-900">
                {gpsStatus === 'OFFLINE'
                  ? 'Unavailable (Offline)'
                  : latestPoint.speedKmh !== null
                    ? `${latestPoint.speedKmh} km/h`
                    : 'Unavailable'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-600" />
              Verified Location &amp; GPS Telemetry
            </h3>
            <span
              className={clsx(
                'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                GPS_BADGE[gpsStatus]
              )}
            >
              {gpsStatus}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900">{currentAreaText}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Last GPS Update</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {formatDate(latestPoint.recordedAt)}
              </p>
              {ageMinutes !== null && (
                <p className="text-[11px] text-slate-500">{ageMinutes} min ago</p>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Verified Coordinates</p>
              <p className="mt-0.5 font-mono font-semibold text-slate-900">
                {latestPoint.lat.toFixed(4)}, {latestPoint.lng.toFixed(4)}
              </p>
              <a
                href={`https://www.openstreetmap.org/?mlat=${latestPoint.lat}&mlon=${latestPoint.lng}#map=14/${latestPoint.lat}/${latestPoint.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
              >
                OpenStreetMap <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* D. Red Stop Markers & Stop History + Configurable Thresholds */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-600 inline-block" />
              Stop History ({stops.length})
            </h3>
            <p className="text-xs text-slate-500">
              Click any red map marker or stop row to view full stop details. Brief traffic delays below threshold are excluded.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">Min Stop:</span>
              <select
                aria-label="Minimum stop duration"
                value={journey.minStopDurationMinutes}
                onChange={(e) =>
                  GpsTrackingService.updateThresholds(lorry.id, {
                    minStopDurationMinutes: Number(e.target.value),
                  })
                }
                className="bg-transparent font-bold text-slate-900 focus:outline-none"
              >
                {[3, 5, 10, 15, 20, 30].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-semibold text-slate-600">Long Stop Alert:</span>
              <select
                aria-label="Long stop alert threshold"
                value={journey.longStopAlertMinutes}
                onChange={(e) =>
                  GpsTrackingService.updateThresholds(lorry.id, {
                    longStopAlertMinutes: Number(e.target.value),
                  })
                }
                className="bg-transparent font-bold text-slate-900 focus:outline-none"
              >
                {[15, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {stops.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No stops longer than {journey.minStopDurationMinutes} minutes detected during this trip.
          </p>
        ) : (
          <div className="space-y-2.5">
            {stops.map((stop, idx) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => setSelectedStop(stop)}
                className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 p-3.5 text-left transition-colors hover:border-red-300 hover:bg-red-50/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {stop.locationLabel}
                      </span>
                      <span
                        className={clsx(
                          'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                          stop.status === 'Current'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        )}
                      >
                        {stop.status === 'Current' ? 'Current Stop' : 'Completed'}
                      </span>
                      {stop.isLongStop && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Long Stop
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Start: {formatDate(stop.startTime)} · End:{' '}
                      {stop.endTime ? formatDate(stop.endTime) : 'Ongoing'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0 flex-shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {formatStopDuration(stop.durationMinutes)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ignition:{' '}
                      <strong className="text-slate-700">
                        {stop.ignitionStatus === 'UNAVAILABLE' ? 'Unavailable' : stop.ignitionStatus}
                      </strong>
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location History (Verified GPS Points for this Lorry & Trip) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            Verified GPS Location History ({sortedPoints.length} pings)
          </span>
          <span className="text-xs font-semibold text-blue-600">
            {showHistory ? 'Hide' : 'Show'}
          </span>
        </button>

        {showHistory && (
          <div className="overflow-x-auto border-t border-slate-100 pt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Area</th>
                  <th className="px-3 py-2">Coordinates</th>
                  <th className="px-3 py-2 text-right">Speed</th>
                  <th className="px-3 py-2">Ignition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...sortedPoints].reverse().map((pt) => (
                  <tr key={pt.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {formatDate(pt.recordedAt)}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {pt.areaLabel ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-600">
                      {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                      {pt.speedKmh !== null ? `${pt.speedKmh} km/h` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      {pt.ignition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stop Details Modal (opened by clicking any Red Marker or Stop History row) */}
      <Modal
        isOpen={!!selectedStop}
        onClose={() => setSelectedStop(null)}
        title="Stop Details"
        subtitle={selectedStop ? `${selectedStop.tripId} · ${lorry.registrationNumber}` : ''}
        maxWidth="md"
      >
        {selectedStop && (
          <div className="space-y-4">
            <div className="space-y-2 text-xs">
              {[
                ['Location / Area', selectedStop.locationLabel],
                ['Status', selectedStop.status === 'Current' ? 'Current (Ongoing Stop)' : 'Completed Stop'],
                ['Stop Start Time', formatDate(selectedStop.startTime)],
                ['Stop End Time', selectedStop.endTime ? formatDate(selectedStop.endTime) : 'Ongoing'],
                ['Total Duration', formatStopDuration(selectedStop.durationMinutes)],
                [
                  'Engine / Ignition Status',
                  selectedStop.ignitionStatus === 'UNAVAILABLE'
                    ? 'Unavailable (Not assumed from zero speed)'
                    : `Ignition ${selectedStop.ignitionStatus}`,
                ],
                ['Verified Coordinates', `${selectedStop.lat.toFixed(5)}, ${selectedStop.lng.toFixed(5)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500">{k}</span>
                  <span className="text-right font-medium text-slate-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <a
                href={`https://www.openstreetmap.org/?mlat=${selectedStop.lat}&mlon=${selectedStop.lng}#map=15/${selectedStop.lat}/${selectedStop.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Clock className="h-3.5 w-3.5" />
                View Stop on OpenStreetMap
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button
                type="button"
                variant="primary"
                onClick={() => setSelectedStop(null)}
                className="min-h-[44px]"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
