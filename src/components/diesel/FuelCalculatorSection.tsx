import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  Calculator,
  CheckCircle2,
  Droplets,
  Fuel,
  MapPin,
  Plus,
  RotateCw,
  Route,
  Save,
  Trash2,
  Truck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { LocationSearchInput } from './LocationSearchInput';
import { RouteMap } from './RouteMap';
import {
  FuelLedgerEntry,
  RouteLocation,
  RoutedPathResult,
  SavedFuelEstimate,
  TripFuelCalculation,
} from '../../types/fuel';
import { Lorry } from '../../types/lorry';
import { calculateTripFuel, summarize } from '../../utils/fuelAnalytics';
import { fetchRoadRoute, formatDuration } from '../../services/routingService';
import { FuelEstimateService } from '../../services/fuelEstimateService';
import { formatDate, formatINR } from '../../utils/formatters';

interface FuelCalculatorSectionProps {
  lorry: Lorry;
  lorryFuelEntries: FuelLedgerEntry[];
}

interface StopItem {
  id: string;
  location: RouteLocation | null;
}

const BUFFER_PRESETS = [5, 10, 15, 20, 25, 30] as const;

export const FuelCalculatorSection: React.FC<FuelCalculatorSectionProps> = ({
  lorry,
  lorryFuelEntries,
}) => {
  // Derive saved mileage & latest diesel price strictly from this lorry's recorded entries
  const lorryDefaults = useMemo(() => {
    const stats = summarize(lorryFuelEntries);
    return {
      mileage: stats.avgMileage ? stats.avgMileage.toFixed(2) : '',
      price: lorryFuelEntries[0] ? lorryFuelEntries[0].ratePerLitre.toFixed(2) : '91.50',
      fullTankFills: stats.fullTankFills,
    };
  }, [lorryFuelEntries]);

  // Section 1: Route State
  const [origin, setOrigin] = useState<RouteLocation | null>(null);
  const [stops, setStops] = useState<StopItem[]>([]);
  const [destination, setDestination] = useState<RouteLocation | null>(null);
  const [includeReturn, setIncludeReturn] = useState(false);

  // OSRM Routing State
  const [routedPath, setRoutedPath] = useState<RoutedPathResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Manual distance fallback (explicitly labelled as demo data when used)
  const [useManualDistance, setUseManualDistance] = useState(false);
  const [manualDistanceKm, setManualDistanceKm] = useState('');

  // Section 2: Truck Details (editable for current estimate without mutating lorry record)
  const [mileageInput, setMileageInput] = useState(lorryDefaults.mileage);
  const [priceInput, setPriceInput] = useState(lorryDefaults.price);

  // Section 3: Additional Fuel Buffer (extra litres, default 20 L)
  const [bufferLitres, setBufferLitres] = useState<number>(20);
  const [customBufferInput, setCustomBufferInput] = useState<string>('');

  // Results & Saved Estimates State
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [savedEstimates, setSavedEstimates] = useState<SavedFuelEstimate[]>(() =>
    FuelEstimateService.getByLorryId(lorry.id)
  );

  // Sync saved estimates for this lorry only
  useEffect(() => {
    setSavedEstimates(FuelEstimateService.getByLorryId(lorry.id));
    const unsub = FuelEstimateService.subscribe(() => {
      setSavedEstimates(FuelEstimateService.getByLorryId(lorry.id));
    });
    return unsub;
  }, [lorry.id]);

  // Ordered waypoints: Origin -> Intermediate Stops -> Destination
  const orderedWaypoints = useMemo(() => {
    const list: RouteLocation[] = [];
    if (origin) list.push(origin);
    for (const s of stops) {
      if (s.location) list.push(s.location);
    }
    if (destination) list.push(destination);
    return list;
  }, [origin, stops, destination]);

  // Fetch actual road route via OSRM whenever origin + destination (+ stops) are valid
  useEffect(() => {
    if (!origin || !destination) {
      setRoutedPath(null);
      setRouteError(null);
      setIsRouting(false);
      return;
    }

    const controller = new AbortController();
    setIsRouting(true);
    setRouteError(null);

    fetchRoadRoute(orderedWaypoints, controller.signal)
      .then((res) => {
        setRoutedPath(res);
        setUseManualDistance(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setRoutedPath(null);
          setRouteError(
            `${err.message} You can retry or enter a manual distance below (labelled as demo data).`
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsRouting(false);
        }
      });

    return () => controller.abort();
  }, [origin, destination, orderedWaypoints]);

  // Active one-way distance
  const activeOneWayDistanceKm = useMemo(() => {
    if (!useManualDistance && routedPath) return routedPath.distanceKm;
    const parsed = parseFloat(manualDistanceKm);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [useManualDistance, routedPath, manualDistanceKm]);

  const activeBufferLitres = useMemo(() => {
    if (customBufferInput.trim() !== '') {
      const parsed = parseFloat(customBufferInput);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
    }
    return bufferLitres;
  }, [customBufferInput, bufferLitres]);

  // Live calculation (shown once user clicks Calculate Fuel, and updates live when buffer/inputs change)
  const calculation: TripFuelCalculation | null = useMemo(() => {
    if (!hasCalculated) return null;
    const mileage = parseFloat(mileageInput);
    const price = parseFloat(priceInput);
    return calculateTripFuel(
      activeOneWayDistanceKm,
      includeReturn,
      mileage,
      price,
      activeBufferLitres
    );
  }, [
    hasCalculated,
    activeOneWayDistanceKm,
    includeReturn,
    mileageInput,
    priceInput,
    activeBufferLitres,
  ]);

  const handleAddStop = () => {
    setStops((prev) => [...prev, { id: `stop-${Date.now()}-${prev.length}`, location: null }]);
  };

  const handleUpdateStop = (id: string, loc: RouteLocation | null) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, location: loc } : s)));
  };

  const handleRemoveStop = (id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSelectBufferPreset = (litres: number) => {
    setBufferLitres(litres);
    setCustomBufferInput('');
  };

  const handleCalculate = () => {
    setSaveNotice(null);
    if (activeOneWayDistanceKm <= 0) {
      setValidationError(
        'Select a starting location and final destination for OSRM road distance, or enter a manual distance.'
      );
      setHasCalculated(false);
      return;
    }
    const mileage = parseFloat(mileageInput);
    if (!Number.isFinite(mileage) || mileage <= 0) {
      setValidationError('Enter a valid truck mileage (KM/L) greater than zero.');
      setHasCalculated(false);
      return;
    }
    const price = parseFloat(priceInput);
    if (!Number.isFinite(price) || price <= 0) {
      setValidationError('Enter a valid diesel price (₹/L) greater than zero.');
      setHasCalculated(false);
      return;
    }
    if (!Number.isFinite(activeBufferLitres) || activeBufferLitres < 0) {
      setValidationError('Enter a valid non-negative fuel buffer in litres.');
      setHasCalculated(false);
      return;
    }

    setValidationError(null);
    setHasCalculated(true);
  };

  const handleSaveEstimate = () => {
    if (!calculation) return;

    const routeLabels =
      orderedWaypoints.length >= 2
        ? orderedWaypoints.map((w) => w.shortName)
        : ['Manual Route (Demo Distance)'];

    FuelEstimateService.saveEstimate({
      ...calculation,
      lorryId: lorry.id,
      lorryRegistration: lorry.registrationNumber,
      routeLabels,
      distanceSource: !useManualDistance && routedPath ? 'OSRM_ROAD' : 'MANUAL_DEMO',
      durationSeconds:
        !useManualDistance && routedPath
          ? includeReturn
            ? routedPath.durationSeconds * 2
            : routedPath.durationSeconds
          : undefined,
    });

    setSaveNotice(
      `Estimate saved to temporary demo session for ${lorry.registrationNumber} (separate from actual diesel purchases).`
    );
    window.setTimeout(() => setSaveNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Main 2-column responsive workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: 3 Form Sections + Calculate Button */}
        <div className="space-y-5 lg:col-span-7">
          {/* SECTION 1: SELECT YOUR ROUTE */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1329] text-white">
                  <Route className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Select Your Route</h2>
                  <p className="text-[11px] text-slate-500">
                    Search cities, towns, areas, or addresses for actual OSRM road distance.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddStop}
              >
                Add Stop
              </Button>
            </div>

            <div className="space-y-3">
              <LocationSearchInput
                label="Starting Location"
                placeholder="Search starting city, town, or address (e.g. Mumbai, Maharashtra)"
                value={origin}
                onSelect={setOrigin}
                badgeText="A"
                badgeColor="bg-emerald-600"
              />

              {stops.map((stop, idx) => (
                <LocationSearchInput
                  key={stop.id}
                  label={`Intermediate Stop ${idx + 1}`}
                  placeholder={`Search stop ${idx + 1} (e.g. Pune, Kolhapur, Hubballi)`}
                  value={stop.location}
                  onSelect={(loc) => handleUpdateStop(stop.id, loc)}
                  badgeText={String(idx + 1)}
                  badgeColor="bg-[#0b1329]"
                  onRemove={() => handleRemoveStop(stop.id)}
                />
              ))}

              <LocationSearchInput
                label="Final Destination"
                placeholder="Search destination city, town, or address (e.g. Bengaluru, Karnataka)"
                value={destination}
                onSelect={setDestination}
                badgeText="B"
                badgeColor="bg-rose-600"
              />
            </div>

            {/* Route Summary Box */}
            {orderedWaypoints.length >= 2 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">Route Summary</span>
                  {routedPath && !useManualDistance ? (
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-700">
                      One-way: {routedPath.distanceKm.toLocaleString('en-IN')} km
                      {routedPath.durationSeconds > 0
                        ? ` · Est. ${formatDuration(routedPath.durationSeconds)}`
                        : ''}
                    </span>
                  ) : isRouting ? (
                    <span className="text-slate-500">Fetching OSRM road distance...</span>
                  ) : null}
                </div>

                <p className="text-slate-600 leading-relaxed">
                  {orderedWaypoints.map((w) => w.shortName).join(' → ')}
                  {includeReturn ? ` → ${orderedWaypoints[0].shortName} (Return)` : ''}
                </p>

                {routedPath && routedPath.legs.length > 1 && !useManualDistance && (
                  <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px] text-slate-500">
                    {routedPath.legs.map((leg, i) => (
                      <div key={i} className="flex justify-between gap-2">
                        <span className="truncate">
                          Leg {i + 1}: {leg.from} → {leg.to}
                        </span>
                        <span className="font-mono font-semibold text-slate-700 flex-shrink-0">
                          {leg.distanceKm.toLocaleString('en-IN')} km
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Include Return Journey Checkbox + Manual Fallback Toggle */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={includeReturn}
                  onChange={(e) => setIncludeReturn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <RotateCw className="h-3.5 w-3.5 text-blue-600" />
                <span>Include Return Journey (doubles road distance)</span>
              </label>

              <button
                type="button"
                onClick={() => setUseManualDistance((v) => !v)}
                className="text-left text-[11px] font-semibold text-blue-600 hover:text-blue-800 sm:text-right"
              >
                {useManualDistance ? 'Use OSRM road distance' : 'Enter manual distance (demo)'}
              </button>
            </div>

            {useManualDistance && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-amber-900">
                    One-Way Distance (KM) — Manual Demo Input
                  </label>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                    Demo Data
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g. 980"
                  value={manualDistanceKm}
                  onChange={(e) => setManualDistanceKm(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-amber-800">
                  Manually entered distance is treated as demo data, not live OSRM road routing.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2: TRUCK DETAILS */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1329] text-white">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">2. Truck Details</h2>
                <p className="text-[11px] text-slate-500">
                  Preselected for this lorry. Edits apply only to this estimate and do not change permanent vehicle records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Selected Lorry</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="font-mono text-xs font-bold text-slate-900">{lorry.registrationNumber}</p>
                  <p className="truncate text-[10px] text-slate-500">
                    {lorry.vehicleType} · {lorry.manufacturer}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Truck Mileage (KM/L) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.05"
                  inputMode="decimal"
                  placeholder="e.g. 3.85"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  {lorryDefaults.fullTankFills > 0
                    ? `Saved avg: ${lorryDefaults.mileage} km/L (${lorryDefaults.fullTankFills} full fills)`
                    : 'No saved mileage — enter manually'}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Diesel Price (₹/L) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.05"
                  inputMode="decimal"
                  placeholder="e.g. 91.50"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">Current fuel rate per litre</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL FUEL BUFFER */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1329] text-white">
                <Droplets className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">3. Additional Fuel Buffer</h2>
                <p className="text-[11px] text-slate-500">
                  Buffer is extra diesel in <strong>litres (L)</strong>, not a percentage — kept as reserve for traffic, idling, or detours.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {BUFFER_PRESETS.map((litres) => {
                const isSelected = customBufferInput.trim() === '' && bufferLitres === litres;
                return (
                  <button
                    key={litres}
                    type="button"
                    onClick={() => handleSelectBufferPreset(litres)}
                    className={clsx(
                      'rounded-lg border px-3.5 py-2 text-xs font-mono font-semibold transition-colors',
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {litres} L
                  </button>
                );
              })}

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  placeholder="Custom (L)"
                  value={customBufferInput}
                  onChange={(e) => setCustomBufferInput(e.target.value)}
                  className={clsx(
                    'w-28 rounded-lg border px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                    customBufferInput.trim() !== '' ? 'border-blue-600 bg-blue-50/40' : 'border-slate-300 bg-white'
                  )}
                />
              </div>
            </div>
          </div>

          {validationError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              leftIcon={<Calculator className="h-4 w-4" />}
              onClick={handleCalculate}
              isLoading={isRouting}
              className="w-full sm:w-auto"
            >
              Calculate Fuel
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Map + Results Summary Card + Saved Estimates */}
        <div className="space-y-5 lg:col-span-5">
          {/* OpenStreetMap + OSRM Route Map */}
          <RouteMap
            waypoints={orderedWaypoints}
            route={routedPath}
            isLoading={isRouting}
            error={routeError}
          />

          {/* Results Summary Card */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-[#0b1329] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold">Fuel Estimate Summary</h3>
              </div>
              <span className="font-mono text-xs text-slate-300">{lorry.registrationNumber}</span>
            </div>

            {!calculation ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                <Calculator className="mx-auto h-7 w-7 text-slate-300" />
                <p className="font-semibold text-slate-700">No calculation yet</p>
                <p>
                  Select your route, confirm truck mileage and buffer, then click{' '}
                  <strong className="text-slate-800">Calculate Fuel</strong> to see the breakdown.
                </p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {useManualDistance && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800">
                    Calculated using manual demo distance (not routed via OSRM).
                  </div>
                )}

                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">
                      Total Trip Distance
                      {calculation.includeReturnJourney && (
                        <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          Includes Return
                        </span>
                      )}
                    </dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {calculation.totalDistanceKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Truck Mileage</dt>
                    <dd className="font-mono font-semibold text-slate-900">
                      {calculation.mileageKmPerL.toFixed(2)} km/L
                    </dd>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                    <dt className="text-slate-500">Base Diesel Required</dt>
                    <dd className="font-mono font-semibold text-slate-900">
                      {calculation.baseDieselLitres.toFixed(2)} L
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Additional Buffer</dt>
                    <dd className="font-mono font-semibold text-slate-900">
                      + {calculation.bufferLitres.toFixed(2)} L
                    </dd>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                    <dt className="font-bold text-slate-900">Total Diesel Required</dt>
                    <dd className="font-mono text-sm font-bold text-blue-700">
                      {calculation.totalDieselLitres.toFixed(2)} L
                    </dd>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                    <dt className="text-slate-500">
                      Base Diesel Cost (@ ₹{calculation.dieselPricePerL.toFixed(2)}/L)
                    </dt>
                    <dd className="font-mono font-semibold text-slate-900">
                      {formatINR(Math.round(calculation.baseDieselCost))}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Buffer Diesel Cost</dt>
                    <dd className="font-mono font-semibold text-slate-900">
                      {formatINR(Math.round(calculation.bufferDieselCost))}
                    </dd>
                  </div>
                </dl>

                {/* Highlighted Total Expense */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Total Estimated Trip Fuel Expense
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Estimate only · separate from actual diesel purchases
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-[#0b1329]">
                    {formatINR(Math.round(calculation.totalFuelCost))}
                  </p>
                </div>

                {/* Save Estimate Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSaveEstimate}
                  className="w-full"
                >
                  Save Fuel Estimate
                </Button>

                {saveNotice && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                    <span>{saveNotice}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Fuel Estimates (Scoped to Selected Lorry, Temporary Local Demo State) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Saved Estimates · {lorry.registrationNumber}
                </h4>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Demo Session
              </span>
            </div>

            {savedEstimates.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">
                No saved estimates for {lorry.registrationNumber} in this session.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {savedEstimates.map((est) => (
                  <li key={est.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{est.routeLabels.join(' → ')}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {est.totalDistanceKm.toLocaleString('en-IN')} km
                        {est.includeReturnJourney ? ' (Return)' : ''} · {est.totalDieselLitres.toFixed(1)} L (incl.{' '}
                        {est.bufferLitres} L buffer) ·{' '}
                        <strong className="font-mono text-slate-800">{formatINR(Math.round(est.totalFuelCost))}</strong>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDate(est.createdAt)} ·{' '}
                        {est.distanceSource === 'OSRM_ROAD' ? 'OSRM Road Route' : 'Manual Demo Distance'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => FuelEstimateService.deleteEstimate(est.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete saved estimate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-slate-400">
              Saved estimates are temporary local demo data and reset on page reload. They are kept separate from actual diesel receipts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
