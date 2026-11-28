import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Droplets,
  FileText,
  Gauge,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  Radio,
  RefreshCw,
  Route as RouteIcon,
  Truck,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { LorryService } from '../../services/lorryService';
import { GpsTrackingService } from '../../services/gpsTrackingService';
import { fetchRoadRoute, formatDuration } from '../../services/routingService';
import {
  calculateTrackedDistanceKm,
  classifyGpsConnection,
  deriveEngineVehicleStatus,
  detectStopsFromHistory,
} from '../../utils/gpsJourneyEngine';
import { RouteLocation, RoutedPathResult } from '../../types/fuel';
import { LocationSearchInput } from '../../components/diesel/LocationSearchInput';
import { RouteMap } from '../../components/diesel/RouteMap';
import { LiveJourneyMap } from '../../components/gps/LiveJourneyMap';
import { formatDate } from '../../utils/formatters';

type PrototypeScreen = 'home' | 'calculator' | 'live';

interface OptionalStop {
  id: string;
  location: RouteLocation | null;
}

export const MobileMapsPrototypePage: React.FC = () => {
  const navigate = useNavigate();
  const lorries = useMemo(() => LorryService.getAllLorries(), []);
  const [selectedLorryId, setSelectedLorryId] = useState(lorries[0]?.id ?? 'LR-001');
  const [screen, setScreen] = useState<PrototypeScreen>('home');

  const lorry = useMemo(
    () => lorries.find((l) => l.id === selectedLorryId) ?? lorries[0],
    [lorries, selectedLorryId]
  );

  // --- Route Calculator State ---
  const [startLoc, setStartLoc] = useState<RouteLocation | null>(null);
  const [optionalStops, setOptionalStops] = useState<OptionalStop[]>([]);
  const [destLoc, setDestLoc] = useState<RouteLocation | null>(null);
  const [calcRoute, setCalcRoute] = useState<RoutedPathResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [showOptionalDiesel, setShowOptionalDiesel] = useState(false);
  const [optionalMileage, setOptionalMileage] = useState('3.8');

  // --- Live Location State ---
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [travelledCoords, setTravelledCoords] = useState<Array<[number, number]>>([]);
  const [travelledRoadKm, setTravelledRoadKm] = useState<number | null>(null);
  const [remainingCoords, setRemainingCoords] = useState<Array<[number, number]>>([]);
  const [remainingRoadKm, setRemainingRoadKm] = useState<number | null>(null);
  const [remainingDurationSec, setRemainingDurationSec] = useState<number | null>(null);
  const [isLiveRouting, setIsLiveRouting] = useState(false);

  const journey = useMemo(
    () => (lorry ? GpsTrackingService.getJourney(lorry.id) : undefined),
    [lorry, nowMs]
  );

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
  const stops = useMemo(() => {
    if (!journey) return [];
    return detectStopsFromHistory(
      sortedPoints,
      journey.minStopDurationMinutes,
      journey.longStopAlertMinutes,
      nowMs
    );
  }, [journey, sortedPoints, nowMs]);
  const gpsTrackedKm = useMemo(() => calculateTrackedDistanceKm(sortedPoints), [sortedPoints]);

  // Fetch OSRM route for Live Location when on Live or Home screen
  useEffect(() => {
    if (!journey || !latestPoint) {
      setTravelledCoords([]);
      setRemainingCoords([]);
      setTravelledRoadKm(null);
      setRemainingRoadKm(null);
      setRemainingDurationSec(null);
      return;
    }

    const controller = new AbortController();
    setIsLiveRouting(true);

    const loadLiveRoute = async () => {
      try {
        const [trav, rem] = await Promise.all([
          fetchRoadRoute(
            [
              {
                label: journey.startLocation.name,
                shortName: journey.startLocation.name,
                lat: journey.startLocation.lat,
                lng: journey.startLocation.lng,
              },
              {
                label: 'Current',
                shortName: 'Current',
                lat: latestPoint.lat,
                lng: latestPoint.lng,
              },
            ],
            controller.signal
          ),
          fetchRoadRoute(
            [
              {
                label: 'Current',
                shortName: 'Current',
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
          ),
        ]);
        if (!controller.signal.aborted) {
          setTravelledCoords(trav.coordinates);
          setTravelledRoadKm(trav.distanceKm);
          setRemainingCoords(rem.coordinates);
          setRemainingRoadKm(rem.distanceKm);
          setRemainingDurationSec(rem.durationSeconds);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTravelledCoords(sortedPoints.map((p) => [p.lat, p.lng]));
          setRemainingCoords([
            [latestPoint.lat, latestPoint.lng],
            [journey.destination.lat, journey.destination.lng],
          ]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLiveRouting(false);
      }
    };

    loadLiveRoute();
    return () => controller.abort();
  }, [journey?.lorryId, latestPoint?.id]);

  // Route Calculator ordered waypoints
  const calcWaypoints = useMemo(() => {
    const list: RouteLocation[] = [];
    if (startLoc) list.push(startLoc);
    optionalStops.forEach((s) => {
      if (s.location) list.push(s.location);
    });
    if (destLoc) list.push(destLoc);
    return list;
  }, [startLoc, optionalStops, destLoc]);

  const handleCalculateRoute = async () => {
    setCalcError(null);
    if (!startLoc) {
      setCalcError('Select a starting location from the suggestions.');
      return;
    }
    if (!destLoc) {
      setCalcError('Select a destination from the suggestions.');
      return;
    }
    const emptyStopIdx = optionalStops.findIndex((s) => !s.location);
    if (emptyStopIdx !== -1) {
      setCalcError(`Stop ${emptyStopIdx + 1} is empty — select a location or remove it.`);
      return;
    }

    setIsCalculating(true);
    try {
      const result = await fetchRoadRoute(calcWaypoints);
      setCalcRoute(result);
    } catch (err) {
      setCalcRoute(null);
      setCalcError(
        err instanceof Error ? err.message : 'Unable to calculate road route. Try again.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const travelledKm = travelledRoadKm ?? gpsTrackedKm;
  const totalKm =
    remainingRoadKm !== null ? Math.round((travelledKm + remainingRoadKm) * 10) / 10 : null;
  const progressPct =
    totalKm && totalKm > 0 ? Math.min(100, Math.max(0, Math.round((travelledKm / totalKm) * 100))) : 0;
  const etaIso =
    remainingDurationSec !== null ? new Date(nowMs + remainingDurationSec * 1000).toISOString() : null;

  const mileageVal = Number(optionalMileage);
  const optionalDieselLitres =
    calcRoute && Number.isFinite(mileageVal) && mileageVal > 0
      ? Math.round((calcRoute.distanceKm / mileageVal) * 10) / 10
      : null;

  const screenTitle =
    screen === 'home'
      ? 'Maps & GPS'
      : screen === 'calculator'
        ? 'Route Calculator'
        : 'Live Location';

  return (
    <div className="min-h-screen w-full bg-slate-200 sm:py-6 flex justify-center font-sans">
      {/* 390px Mobile-First App Shell */}
      <div className="relative flex min-h-screen sm:min-h-[844px] w-full max-w-[390px] flex-col bg-slate-50 sm:rounded-[32px] sm:border-[6px] sm:border-[#0b1329] sm:shadow-2xl overflow-hidden">
        {/* Premium Navy Top App Bar */}
        <header className="sticky top-0 z-30 bg-[#0b1329] px-4 pt-4 pb-3.5 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {screen !== 'home' ? (
                <button
                  type="button"
                  onClick={() => setScreen('home')}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white active:bg-white/20"
                  aria-label="Back to Maps & GPS Home"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Truck className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                  FleetOS Mobile
                </p>
                <h1 className="truncate text-sm font-bold leading-tight">{screenTitle}</h1>
              </div>
            </div>

            {/* Lorry Selector */}
            <select
              aria-label="Select lorry"
              value={selectedLorryId}
              onChange={(e) => setSelectedLorryId(e.target.value)}
              className="max-w-[140px] rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 font-mono text-[11px] font-bold text-white focus:outline-none"
            >
              {lorries.map((l) => (
                <option key={l.id} value={l.id} className="text-slate-900">
                  {l.registrationNumber}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Scrollable Screen Body */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
          {/* ==================== SCREEN 1: MAPS & GPS HOME ==================== */}
          {screen === 'home' && lorry && (
            <>
              {/* Vehicle Hero Card */}
              <div className="rounded-2xl bg-[#0b1329] p-4 text-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-base font-bold tracking-wide">
                      {lorry.registrationNumber}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {lorry.manufacturer} {lorry.model} · {lorry.vehicleType}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                      gpsStatus === 'LIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : gpsStatus === 'STALE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-white/10 text-slate-300 border border-white/15'
                    )}
                  >
                    <span
                      className={clsx(
                        'h-1.5 w-1.5 rounded-full',
                        gpsStatus === 'LIVE'
                          ? 'bg-emerald-400'
                          : gpsStatus === 'STALE'
                            ? 'bg-amber-400'
                            : 'bg-slate-400'
                      )}
                    />
                    {gpsStatus === 'LIVE' ? 'LIVE (DEMO)' : gpsStatus}
                  </span>
                </div>

                {journey && latestPoint ? (
                  <div className="rounded-xl bg-white/10 p-3 space-y-1.5">
                    <p className="text-[11px] font-semibold text-blue-200">
                      {journey.startLocation.name.split(',')[0]} →{' '}
                      {journey.destination.name.split(',')[0]}
                    </p>
                    <p className="text-xs text-white flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">
                        {latestPoint.areaLabel ?? `${latestPoint.lat.toFixed(3)}, ${latestPoint.lng.toFixed(3)}`}
                      </span>
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
                      <span>{engineInfo.status}</span>
                      <span>
                        {remainingRoadKm !== null ? `${remainingRoadKm} km left` : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/10 p-3 text-xs text-slate-300">
                    No active GPS tracker connected to this lorry.
                  </div>
                )}
              </div>

              {/* Primary Navigation Cards */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Maps &amp; GPS Tools
                </h2>

                <button
                  type="button"
                  onClick={() => setScreen('calculator')}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition-all hover:border-blue-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                      <RouteIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">Route Calculator</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Road distance, stops &amp; estimated time
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('live')}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition-all hover:border-blue-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0b1329] text-white shadow-sm">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">Live Location</p>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                          Demo
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Vehicle marker, speed, ETA &amp; progress
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                </button>
              </div>

              {/* Prototype Info Footnote */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-[11px] text-blue-900">
                <strong>Mobile Prototype (390px):</strong> Uses live OpenStreetMap geocoding and
                OSRM road routing. Live GPS telemetry is clearly labelled <strong>DEMO</strong>.
              </div>
            </>
          )}

          {/* ==================== SCREEN 2: ROUTE CALCULATOR ==================== */}
          {screen === 'calculator' && (
            <div className="space-y-4">
              {/* Inputs Card (No route options — clean and focused) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <LocationSearchInput
                  label="Starting Location"
                  placeholder="Search starting city or area..."
                  value={startLoc}
                  onSelect={(loc) => {
                    setStartLoc(loc);
                    setCalcRoute(null);
                    setCalcError(null);
                  }}
                  badgeText="A"
                  badgeColor="bg-emerald-600"
                />

                {/* Optional Intermediate Stops */}
                {optionalStops.map((stop, idx) => (
                  <LocationSearchInput
                    key={stop.id}
                    label={`Optional Stop ${idx + 1}`}
                    placeholder={`Search stop ${idx + 1}...`}
                    value={stop.location}
                    onSelect={(loc) => {
                      setOptionalStops((prev) =>
                        prev.map((s) => (s.id === stop.id ? { ...s, location: loc } : s))
                      );
                      setCalcRoute(null);
                      setCalcError(null);
                    }}
                    badgeText={String(idx + 1)}
                    badgeColor="bg-[#0b1329]"
                    onRemove={() => {
                      setOptionalStops((prev) => prev.filter((s) => s.id !== stop.id));
                      setCalcRoute(null);
                      setCalcError(null);
                    }}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setOptionalStops((prev) => [
                      ...prev,
                      { id: `opt-stop-${Date.now()}-${prev.length}`, location: null },
                    ]);
                    setCalcRoute(null);
                  }}
                  className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 text-xs font-semibold text-blue-700 active:bg-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Optional Stop
                </button>

                <LocationSearchInput
                  label="Destination"
                  placeholder="Search destination city or area..."
                  value={destLoc}
                  onSelect={(loc) => {
                    setDestLoc(loc);
                    setCalcRoute(null);
                    setCalcError(null);
                  }}
                  badgeText="B"
                  badgeColor="bg-red-600"
                />

                {calcError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <span>{calcError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={isCalculating}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm active:bg-blue-700 disabled:opacity-60"
                >
                  <Navigation className="h-4 w-4" />
                  {isCalculating ? 'Calculating Road Route...' : 'Calculate Route'}
                </button>
              </div>

              {/* Distance & Estimated Journey Time Result Card */}
              {calcRoute && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#0b1329] p-3.5 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                        Road Distance
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold">
                        {calcRoute.distanceKm.toLocaleString('en-IN')} km
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        Est. Journey Time
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-blue-950">
                        {formatDuration(calcRoute.durationSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Leg breakdown when stops exist */}
                  {calcRoute.legs.length > 1 && (
                    <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                      {calcRoute.legs.map((leg, i) => (
                        <div
                          key={`${leg.from}-${leg.to}-${i}`}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="truncate font-medium text-slate-700 pr-2">
                            {i + 1}. {leg.from} → {leg.to}
                          </span>
                          <span className="whitespace-nowrap font-mono font-bold text-slate-900">
                            {leg.distanceKm} km · {formatDuration(leg.durationSeconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Secondary Optional Detail: Estimated Diesel */}
                  <div className="border-t border-slate-100 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setShowOptionalDiesel((v) => !v)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-600"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-blue-600" />
                        Estimated Diesel (Optional)
                      </span>
                      {showOptionalDiesel ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {showOptionalDiesel && (
                      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                        <label className="text-[11px] text-slate-600">
                          Mileage (km/L):
                          <input
                            type="number"
                            min="1"
                            max="15"
                            step="0.1"
                            value={optionalMileage}
                            onChange={(e) => setOptionalMileage(e.target.value)}
                            className="ml-2 w-16 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-bold text-slate-900"
                          />
                        </label>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-slate-900">
                            {optionalDieselLitres !== null ? `~${optionalDieselLitres} L` : '—'}
                          </p>
                          <p className="text-[10px] text-slate-500">Optional est.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map Preview */}
              <RouteMap
                waypoints={calcWaypoints}
                route={calcRoute}
                isLoading={isCalculating}
                error={calcError}
              />
            </div>
          )}

          {/* ==================== SCREEN 3: LIVE LOCATION ==================== */}
          {screen === 'live' && lorry && (
            <div className="space-y-4">
              {/* Clear DEMO Telemetry Label */}
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] text-amber-900">
                <Radio className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <span>
                  <strong>DEMO Telemetry:</strong> Simulated GPS positions are shown for prototype
                  preview until a real GPS tracker is connected.
                </span>
              </div>

              {!journey || !latestPoint ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <Radio className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-900">GPS Unavailable</p>
                  <p className="mt-1 text-xs text-slate-500">
                    No GPS device is linked to {lorry.registrationNumber}. Switch to MH 12 RN 4821
                    at the top to preview a live demo journey.
                  </p>
                </div>
              ) : (
                <>
                  {/* Map with Vehicle Marker & Route */}
                  <LiveJourneyMap
                    startLocation={journey.startLocation}
                    destination={journey.destination}
                    latestPoint={latestPoint}
                    travelledCoords={
                      travelledCoords.length >= 2
                        ? travelledCoords
                        : sortedPoints.map((p) => [p.lat, p.lng])
                    }
                    remainingCoords={remainingCoords}
                    stops={stops}
                    onSelectStop={() => {}}
                  />

                  {/* Vehicle Status Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Vehicle Status
                        </p>
                        <p className="text-sm font-bold text-slate-900">{engineInfo.status}</p>
                      </div>
                      <span
                        className={clsx(
                          'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase',
                          gpsStatus === 'LIVE'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : gpsStatus === 'STALE'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-red-200 bg-red-50 text-red-700'
                        )}
                      >
                        GPS {gpsStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{engineInfo.detailNote}</p>
                  </div>

                  {/* Speed, ETA & Remaining Distance */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-blue-600" /> Speed
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                        {gpsStatus === 'OFFLINE'
                          ? '—'
                          : latestPoint.speedKmh !== null
                            ? `${latestPoint.speedKmh} km/h`
                            : '—'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-600" /> ETA (Est.)
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                        {remainingDurationSec !== null
                          ? formatDuration(remainingDurationSec)
                          : '—'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Remaining</p>
                      <p className="mt-1 font-mono text-sm font-bold text-blue-700">
                        {remainingRoadKm !== null ? `${remainingRoadKm} km` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Journey Progress Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Journey Progress</span>
                      <span className="font-mono font-bold text-emerald-700">{progressPct}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className="h-full rounded-full bg-emerald-500 transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[45%]">
                        {journey.startLocation.name.split(',')[0]}
                      </span>
                      <span className="truncate max-w-[45%] text-right">
                        {journey.destination.name.split(',')[0]}
                      </span>
                    </div>
                    {etaIso && (
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Estimated Arrival: <strong className="text-slate-700">{formatDate(etaIso)}</strong>
                      </p>
                    )}
                  </div>

                  {/* Last Updated Footer */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px]">
                      <p className="font-semibold text-slate-500">Last Updated</p>
                      <p className="font-bold text-slate-900">
                        {formatDate(latestPoint.recordedAt)}
                        {ageMinutes !== null ? ` (${ageMinutes}m ago)` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNowMs(Date.now())}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-50 px-3 text-xs font-bold text-blue-700 active:bg-blue-100"
                    >
                      <RefreshCw className={clsx('h-3.5 w-3.5', isLiveRouting && 'animate-spin')} />
                      Refresh
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar: Maps, Diesel, Maintenance, Invoices */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2"
        >
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl bg-blue-50 text-blue-600"
          >
            <MapIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold">Maps</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/fleet/${selectedLorryId}/diesel`)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-slate-500 hover:text-slate-900"
          >
            <Droplets className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Diesel</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/fleet/${selectedLorryId}/maintenance`)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-slate-500 hover:text-slate-900"
          >
            <Wrench className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Maintenance</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/fleet/${selectedLorryId}/invoices`)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-slate-500 hover:text-slate-900"
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Invoices</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
