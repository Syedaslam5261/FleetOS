import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Clock,
  MapPin,
  Navigation,
  Play,
  Route as RouteIcon,
  Trash2,
} from 'lucide-react';
import { Lorry } from '../../types/lorry';
import { SavedPlannedRoute, SavedRouteService } from '../../services/savedRouteService';
import { formatDuration } from '../../services/routingService';
import { NavigationStateStore } from '../../utils/navigationStateStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDate } from '../../utils/formatters';

interface SavedRoutesSectionProps {
  lorry: Lorry;
  onOpenCalculator: () => void;
}

export const SavedRoutesSection: React.FC<SavedRoutesSectionProps> = ({
  lorry,
  onOpenCalculator,
}) => {
  const [tick, setTick] = useState(0);
  const [viewingRoute, setViewingRoute] = useState<SavedPlannedRoute | null>(null);

  useEffect(() => {
    return SavedRouteService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const savedRoutes = useMemo(
    () => SavedRouteService.getByLorryId(lorry.id),
    [lorry.id, tick]
  );

  const handleReuse = (sr: SavedPlannedRoute) => {
    NavigationStateStore.setDraft(lorry.id, 'route-planner', {
      startLocation: sr.startLocation,
      stops: sr.intermediateStops.map((loc, idx) => ({
        id: `reuse-${sr.id}-${idx}`,
        location: loc,
      })),
      destination: sr.destination,
    });
    onOpenCalculator();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Saved Routes — <span className="font-mono">{lorry.registrationNumber}</span>
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Previously planned road routes saved in localStorage for this lorry.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={<RouteIcon className="h-4 w-4" />}
          onClick={onOpenCalculator}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Plan New Route
        </Button>
      </div>

      {/* Saved Routes List */}
      {savedRoutes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Bookmark className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-800">
            No saved routes for {lorry.registrationNumber}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Use Route Calculator to calculate a road route and save it here for quick reuse.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={onOpenCalculator}
            className="mt-4 min-h-[44px]"
          >
            Open Route Calculator
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {savedRoutes.map((sr) => (
            <div
              key={sr.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#0b1329] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      {sr.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Saved {formatDate(sr.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {sr.startLocation.shortName}
                    {sr.intermediateStops.length > 0 &&
                      ` → ${sr.intermediateStops.map((s) => s.shortName).join(' → ')}`}
                    {' → '}
                    {sr.destination.shortName}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-right">
                    <p className="font-mono text-xs font-bold text-slate-900">
                      {sr.distanceKm.toLocaleString('en-IN')} km
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Est. {formatDuration(sr.durationSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setViewingRoute(sr)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open Details
                </button>
                <button
                  type="button"
                  onClick={() => handleReuse(sr)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Play className="h-3.5 w-3.5" />
                  Reuse in Calculator
                </button>
                <button
                  type="button"
                  onClick={() => SavedRouteService.deleteRoute(sr.id)}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  aria-label={`Delete saved route ${sr.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Open Saved Route Details Modal */}
      <Modal
        isOpen={!!viewingRoute}
        onClose={() => setViewingRoute(null)}
        title={viewingRoute ? `Saved Route ${viewingRoute.id}` : 'Route Details'}
        subtitle={
          viewingRoute
            ? `${viewingRoute.startLocation.shortName} → ${viewingRoute.destination.shortName}`
            : ''
        }
        maxWidth="md"
      >
        {viewingRoute && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0b1329] p-3.5 text-white">
                <p className="text-[10px] font-semibold uppercase text-slate-300">Road Distance</p>
                <p className="mt-1 font-mono text-base font-bold">
                  {viewingRoute.distanceKm.toLocaleString('en-IN')} km
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase text-blue-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Est. Duration
                </p>
                <p className="mt-1 font-mono text-base font-bold text-blue-950">
                  {formatDuration(viewingRoute.durationSeconds)}
                </p>
              </div>
            </div>

            {viewingRoute.legs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-700">Stop-by-Stop Breakdown</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {viewingRoute.legs.map((leg, i) => (
                    <div
                      key={`${leg.from}-${leg.to}-${i}`}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs"
                    >
                      <span className="font-medium text-slate-800">
                        {i + 1}. {leg.from} → {leg.to}
                      </span>
                      <span className="whitespace-nowrap font-mono font-bold text-slate-900">
                        {leg.distanceKm} km · Est. {formatDuration(leg.durationSeconds)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setViewingRoute(null)}
                className="min-h-[44px]"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<Navigation className="h-4 w-4" />}
                onClick={() => {
                  const target = viewingRoute;
                  setViewingRoute(null);
                  handleReuse(target);
                }}
                className="min-h-[44px]"
              >
                Reuse in Calculator
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
