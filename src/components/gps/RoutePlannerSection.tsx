import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkCheck,
  Check,
  Copy,
  Crosshair,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  RotateCcw,
  Route as RouteIcon,
  Save,
  Share2,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { RouteLocation, RoutedPathResult } from '../../types/fuel';
import { LorryService } from '../../services/lorryService';
import {
  fetchRoadRouteAlternatives,
  formatDuration,
  reverseGeocodeLocation,
} from '../../services/routingService';
import {
  formatRouteShareText,
  SavedPlannedRoute,
  SavedRouteService,
} from '../../services/savedRouteService';
import { LocationSearchInput } from '../diesel/LocationSearchInput';
import { MapWaypointMarker, RoutePlannerMap } from './RoutePlannerMap';
import { Button } from '../common/Button';
import { formatDate } from '../../utils/formatters';

interface RoutePlannerSectionProps {
  lorry: Lorry;
}

interface IntermediateStopItem {
  id: string;
  location: RouteLocation | null;
}

type PickTarget =
  | { kind: 'start' }
  | { kind: 'destination' }
  | { kind: 'stop'; stopId: string };

export const RoutePlannerSection: React.FC<RoutePlannerSectionProps> = ({ lorry }) => {
  const allLorries = useMemo(() => LorryService.getAllLorries(), []);
  const [selectedLorryId, setSelectedLorryId] = useState(lorry.id);

  const selectedLorry = useMemo(
    () => allLorries.find((l) => l.id === selectedLorryId) ?? lorry,
    [allLorries, selectedLorryId, lorry]
  );

  // Waypoint state
  const [startLocation, setStartLocation] = useState<RouteLocation | null>(null);
  const [stops, setStops] = useState<IntermediateStopItem[]>([]);
  const [destination, setDestination] = useState<RouteLocation | null>(null);
  const [pickTarget, setPickTarget] = useState<PickTarget | null>(null);

  // Routing state (strictly from OSRM responses, never fabricated)
  const [routes, setRoutes] = useState<RoutedPathResult[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Action feedback & Saved routes
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    setSelectedLorryId(lorry.id);
  }, [lorry.id]);

  useEffect(() => {
    return SavedRouteService.subscribe(() => setSavedTick((t) => t + 1));
  }, []);

  const savedRoutes = useMemo(
    () => SavedRouteService.getByLorryId(selectedLorry.id),
    [selectedLorry.id, savedTick]
  );

  const showNotice = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  // Clear calculated routes whenever waypoints change so user recalculates accurately
  const invalidateCalculation = () => {
    setRoutes([]);
    setSelectedRouteIdx(0);
    setRouteError(null);
  };

  const orderedWaypoints = useMemo(() => {
    const list: RouteLocation[] = [];
    if (startLocation) list.push(startLocation);
    stops.forEach((s) => {
      if (s.location) list.push(s.location);
    });
    if (destination) list.push(destination);
    return list;
  }, [startLocation, stops, destination]);

  const mapMarkers = useMemo<MapWaypointMarker[]>(() => {
    const list: MapWaypointMarker[] = [];
    if (startLocation) {
      list.push({ key: 'start', role: 'start', location: startLocation });
    }
    stops.forEach((s, idx) => {
      if (s.location) {
        list.push({ key: s.id, role: 'stop', stopIndex: idx, location: s.location });
      }
    });
    if (destination) {
      list.push({ key: 'destination', role: 'destination', location: destination });
    }
    return list;
  }, [startLocation, stops, destination]);

  const activeRoute = routes[selectedRouteIdx] ?? null;

  const handleAddStop = () => {
    setStops((prev) => [...prev, { id: `stop-${Date.now()}-${prev.length}`, location: null }]);
    invalidateCalculation();
  };

  const handleRemoveStop = (id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    if (pickTarget?.kind === 'stop' && pickTarget.stopId === id) setPickTarget(null);
    invalidateCalculation();
  };

  const handleMoveStop = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= stops.length) return;
    setStops((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    invalidateCalculation();
  };

  const applyLocationToTarget = useCallback(
    (target: PickTarget, loc: RouteLocation) => {
      if (target.kind === 'start') setStartLocation(loc);
      else if (target.kind === 'destination') setDestination(loc);
      else {
        setStops((prev) =>
          prev.map((s) => (s.id === target.stopId ? { ...s, location: loc } : s))
        );
      }
      invalidateCalculation();
    },
    []
  );

  const handleMapPick = useCallback(
    async (lat: number, lng: number) => {
      if (!pickTarget) return;
      const target = pickTarget;
      setPickTarget(null);
      let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        label = await reverseGeocodeLocation(lat, lng);
      } catch {
        // Fallback to verified clicked coordinates
      }
      applyLocationToTarget(target, { label, shortName: label, lat, lng });
      showNotice(`Location updated on map: ${label}`);
    },
    [pickTarget, applyLocationToTarget]
  );

  const handleDragMarker = useCallback(
    async (marker: MapWaypointMarker, lat: number, lng: number) => {
      let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        label = await reverseGeocodeLocation(lat, lng);
      } catch {
        // Keep coordinates if reverse geocode fails
      }
      const target: PickTarget =
        marker.role === 'start'
          ? { kind: 'start' }
          : marker.role === 'destination'
            ? { kind: 'destination' }
            : { kind: 'stop', stopId: marker.key };
      applyLocationToTarget(target, { label, shortName: label, lat, lng });
      showNotice(`Adjusted pin to ${label}. Click Calculate Route to update.`);
    },
    [applyLocationToTarget]
  );

  const handleCalculateRoute = async () => {
    setRouteError(null);
    if (!startLocation) {
      setRouteError('Please select a valid Starting Location from search or on the map.');
      return;
    }
    if (!destination) {
      setRouteError('Please select a valid Destination from search or on the map.');
      return;
    }
    const incompleteStop = stops.findIndex((s) => !s.location);
    if (incompleteStop !== -1) {
      setRouteError(
        `Intermediate Stop ${incompleteStop + 1} is empty. Please select a location or remove it.`
      );
      return;
    }

    setIsCalculating(true);
    try {
      const results = await fetchRoadRouteAlternatives(orderedWaypoints);
      setRoutes(results);
      setSelectedRouteIdx(0);
    } catch (err) {
      setRoutes([]);
      setRouteError(
        err instanceof Error
          ? err.message
          : 'Failed to calculate road route. Please verify locations and try again.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearRoute = () => {
    setStartLocation(null);
    setStops([]);
    setDestination(null);
    setPickTarget(null);
    invalidateCalculation();
  };

  const handleSaveRoute = () => {
    if (!startLocation || !destination || !activeRoute) {
      setRouteError('Calculate a valid road route before saving.');
      return;
    }
    const validStops = stops
      .map((s) => s.location)
      .filter((loc): loc is RouteLocation => loc !== null);

    const saved = SavedRouteService.saveRoute({
      lorryId: selectedLorry.id,
      lorryRegistration: selectedLorry.registrationNumber,
      startLocation,
      destination,
      intermediateStops: validStops,
      distanceKm: activeRoute.distanceKm,
      durationSeconds: activeRoute.durationSeconds,
      legs: activeRoute.legs,
      routeOptionLabel:
        selectedRouteIdx === 0 ? 'Primary Route' : `Alternative Route ${selectedRouteIdx}`,
    });
    showNotice(`Saved route ${saved.id} for ${selectedLorry.registrationNumber} (no trip created).`);
  };

  const buildShareText = () => {
    if (!startLocation || !destination || !activeRoute) return '';
    return formatRouteShareText({
      lorryRegistration: selectedLorry.registrationNumber,
      startLocation,
      destination,
      intermediateStops: stops
        .map((s) => s.location)
        .filter((l): l is RouteLocation => l !== null),
      distanceKm: activeRoute.distanceKm,
      durationLabel: formatDuration(activeRoute.durationSeconds),
      legs: activeRoute.legs,
      formatLegDuration: formatDuration,
    });
  };

  const handleCopyRoute = async () => {
    const text = buildShareText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showNotice('Route details copied to clipboard.');
    } catch {
      showNotice('Could not access clipboard on this browser.');
    }
  };

  const handleShareRoute = async () => {
    const text = buildShareText();
    if (!text) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FleetOS Route — ${selectedLorry.registrationNumber}`,
          text,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to copy
      }
    }
    await handleCopyRoute();
  };

  const handleLoadSaved = (saved: SavedPlannedRoute) => {
    setSelectedLorryId(saved.lorryId);
    setStartLocation(saved.startLocation);
    setDestination(saved.destination);
    setStops(
      saved.intermediateStops.map((loc, idx) => ({
        id: `loaded-${saved.id}-${idx}`,
        location: loc,
      }))
    );
    invalidateCalculation();
    showNotice(`Loaded ${saved.id}. Click "Calculate Route" to render live road path.`);
  };

  const pickingLabel = !pickTarget
    ? null
    : pickTarget.kind === 'start'
      ? 'Starting Location'
      : pickTarget.kind === 'destination'
        ? 'Destination'
        : `Intermediate Stop ${stops.findIndex((s) => s.id === pickTarget.stopId) + 1}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Plan a Route</h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Search locations, add &amp; reorder stops, and calculate actual road distance and estimated travel time via OpenStreetMap + OSRM.
          </p>
        </div>

        {/* Lorry Selector */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Selected Lorry
          </label>
          <select
            aria-label="Select lorry registration number"
            value={selectedLorry.id}
            onChange={(e) => setSelectedLorryId(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            {allLorries.map((l) => (
              <option key={l.id} value={l.id}>
                {l.registrationNumber} — {l.vehicleType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Two-Column Layout: Route Inputs (left) + Large Interactive Map (right) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Route Inputs Card */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Route Locations</h2>
            <span className="text-[11px] text-slate-500">Search or pick on map</span>
          </div>

          {/* Starting Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Starting Location</span>
              <button
                type="button"
                onClick={() =>
                  setPickTarget((prev) => (prev?.kind === 'start' ? null : { kind: 'start' }))
                }
                className={clsx(
                  'inline-flex items-center gap-1 text-[11px] font-semibold',
                  pickTarget?.kind === 'start' ? 'text-blue-700 underline' : 'text-slate-500 hover:text-blue-600'
                )}
              >
                <Crosshair className="h-3 w-3" />
                {pickTarget?.kind === 'start' ? 'Cancel map pick' : 'Pick on map'}
              </button>
            </div>
            <LocationSearchInput
              placeholder="Search starting city, town, or address..."
              value={startLocation}
              onSelect={(loc) => {
                setStartLocation(loc);
                invalidateCalculation();
              }}
              badgeText="S"
              badgeColor="bg-emerald-600"
            />
          </div>

          {/* Intermediate Stops (Add, Reorder, Remove) */}
          <div className="space-y-2.5">
            {stops.map((stop, idx) => (
              <div key={stop.id} className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    Intermediate Stop {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPickTarget((prev) =>
                          prev?.kind === 'stop' && prev.stopId === stop.id
                            ? null
                            : { kind: 'stop', stopId: stop.id }
                        )
                      }
                      className="rounded px-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600"
                      title="Pick stop on map"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStop(idx, -1)}
                      className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                      title="Move stop up"
                      aria-label={`Move stop ${idx + 1} up`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === stops.length - 1}
                      onClick={() => handleMoveStop(idx, 1)}
                      className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                      title="Move stop down"
                      aria-label={`Move stop ${idx + 1} down`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <LocationSearchInput
                  placeholder={`Search stop ${idx + 1} (e.g. Suryapet)...`}
                  value={stop.location}
                  onSelect={(loc) => {
                    setStops((prev) =>
                      prev.map((s) => (s.id === stop.id ? { ...s, location: loc } : s))
                    );
                    invalidateCalculation();
                  }}
                  badgeText={String(idx + 1)}
                  badgeColor="bg-[#0b1329]"
                  onRemove={() => handleRemoveStop(stop.id)}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddStop}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Add Intermediate Stop
            </button>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Destination</span>
              <button
                type="button"
                onClick={() =>
                  setPickTarget((prev) =>
                    prev?.kind === 'destination' ? null : { kind: 'destination' }
                  )
                }
                className={clsx(
                  'inline-flex items-center gap-1 text-[11px] font-semibold',
                  pickTarget?.kind === 'destination'
                    ? 'text-blue-700 underline'
                    : 'text-slate-500 hover:text-blue-600'
                )}
              >
                <Crosshair className="h-3 w-3" />
                {pickTarget?.kind === 'destination' ? 'Cancel map pick' : 'Pick on map'}
              </button>
            </div>
            <LocationSearchInput
              placeholder="Search destination city, town, or address..."
              value={destination}
              onSelect={(loc) => {
                setDestination(loc);
                invalidateCalculation();
              }}
              badgeText="D"
              badgeColor="bg-red-600"
            />
          </div>

          {/* Primary Calculate Route + Clear Actions */}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              leftIcon={<Navigation className="h-4 w-4" />}
              onClick={handleCalculateRoute}
              disabled={isCalculating}
              className="min-h-[46px] flex-1"
            >
              {isCalculating ? 'Calculating...' : 'Calculate Route'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={handleClearRoute}
              className="min-h-[46px]"
            >
              Clear Route
            </Button>
          </div>

          {/* Alternative Routes Comparison (when OSRM returns > 1 route) */}
          {routes.length > 1 && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-700">
                Compare Alternative Road Routes ({routes.length})
              </p>
              <div className="grid grid-cols-1 gap-2">
                {routes.map((rt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedRouteIdx(idx)}
                    className={clsx(
                      'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors',
                      selectedRouteIdx === idx
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span className="font-bold">
                      {idx === 0 ? 'Primary Route' : `Alternative ${idx}`}
                    </span>
                    <span className="font-mono font-semibold">
                      {rt.distanceKm.toLocaleString('en-IN')} km · Est. {formatDuration(rt.durationSeconds)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Large Interactive Map */}
        <div className="lg:col-span-7">
          <RoutePlannerMap
            markers={mapMarkers}
            routes={routes}
            selectedRouteIndex={selectedRouteIdx}
            onSelectRouteIndex={setSelectedRouteIdx}
            pickingLabel={pickingLabel}
            onMapPick={handleMapPick}
            onDragMarker={handleDragMarker}
            isLoading={isCalculating}
            error={routeError}
          />
        </div>
      </div>

      {/* Route Details Panel (Journey Summary + Stop-by-Stop Breakdown + Route Management) */}
      {activeRoute && startLocation && destination && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Route Details &amp; Journey Summary</h2>
              <p className="text-xs text-slate-500">
                Calculated from actual OSRM road network data. Travel duration is an estimate.
              </p>
            </div>

            {/* Route Management Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSaveRoute}
                className="min-h-[42px]"
              >
                Save Route
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Copy className="h-4 w-4" />}
                onClick={handleCopyRoute}
                className="min-h-[42px]"
              >
                Copy
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Share2 className="h-4 w-4" />}
                onClick={handleShareRoute}
                className="min-h-[42px]"
              >
                Share
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={handleCalculateRoute}
                className="min-h-[42px]"
              >
                Recalculate
              </Button>
            </div>
          </div>

          {/* Journey Summary Grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Starting Location</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{startLocation.shortName}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Destination</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{destination.shortName}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Selected Lorry</p>
              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                {selectedLorry.registrationNumber}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Intermediate Stops</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{stops.length}</p>
            </div>
            <div className="rounded-lg bg-[#0b1329] p-3 text-white">
              <p className="text-[10px] font-semibold uppercase text-slate-300">Total Road Distance</p>
              <p className="mt-1 font-mono text-base font-bold">
                {activeRoute.distanceKm.toLocaleString('en-IN')} km
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-[10px] font-semibold uppercase text-blue-700">
                Est. Journey Duration
              </p>
              <p className="mt-1 font-mono text-base font-bold text-blue-950">
                {formatDuration(activeRoute.durationSeconds)}
              </p>
              <p className="text-[10px] text-blue-700">Estimated</p>
            </div>
          </div>

          {/* Stop-by-Stop Breakdown */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">Stop-by-Stop Breakdown</h3>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {activeRoute.legs.map((leg, i) => (
                <div
                  key={`${leg.from}-${leg.to}-${i}`}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[11px] text-slate-700">
                      {i + 1}
                    </span>
                    <span>
                      {leg.from} → {leg.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pl-8 sm:pl-0 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {leg.distanceKm.toLocaleString('en-IN')} km
                    </span>
                    <span className="text-slate-500">
                      Est. {formatDuration(leg.durationSeconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved Planned Routes for Selected Lorry */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Saved Planned Routes — <span className="font-mono">{selectedLorry.registrationNumber}</span> ({savedRoutes.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Saving a route does not start a trip
          </span>
        </div>

        {savedRoutes.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No saved routes for {selectedLorry.registrationNumber} yet. Calculate a route and click &ldquo;Save Route&rdquo;.
          </p>
        ) : (
          <div className="space-y-2">
            {savedRoutes.map((sr) => (
              <div
                key={sr.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#0b1329] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      {sr.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {sr.startLocation.shortName}
                      {sr.intermediateStops.length > 0 &&
                        ` → ${sr.intermediateStops.map((s) => s.shortName).join(' → ')}`}
                      {' → '}
                      {sr.destination.shortName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sr.distanceKm.toLocaleString('en-IN')} km · Est. {formatDuration(sr.durationSeconds)} · Saved {formatDate(sr.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadSaved(sr)}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => SavedRouteService.deleteRoute(sr.id)}
                    className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    aria-label={`Delete ${sr.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
