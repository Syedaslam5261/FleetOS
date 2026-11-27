import { RouteLocation } from '../types/fuel';

export interface SavedRouteLeg {
  from: string;
  to: string;
  distanceKm: number;
  durationSeconds: number;
}

export interface SavedPlannedRoute {
  id: string;
  lorryId: string;
  lorryRegistration: string;
  startLocation: RouteLocation;
  destination: RouteLocation;
  intermediateStops: RouteLocation[];
  distanceKm: number;
  durationSeconds: number;
  legs: SavedRouteLeg[];
  routeOptionLabel: string;
  createdAt: string; // ISO UTC
}

type Listener = () => void;

/**
 * Reactive session store for Planned Routes.
 * Strictly isolated from Trip Management — saving a route NEVER creates or starts a trip.
 */
class SavedRouteServiceClass {
  private routes: SavedPlannedRoute[] = [];
  private listeners: Set<Listener> = new Set();
  private seq = 1;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getAll(): SavedPlannedRoute[] {
    return [...this.routes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getByLorryId(lorryId: string): SavedPlannedRoute[] {
    return this.routes
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveRoute(data: Omit<SavedPlannedRoute, 'id' | 'createdAt'>): SavedPlannedRoute {
    if (!data.startLocation || !data.destination || !Number.isFinite(data.distanceKm) || data.distanceKm <= 0) {
      throw new Error('Cannot save an incomplete or uncalculated route.');
    }
    const record: SavedPlannedRoute = {
      ...data,
      id: `RTE-2026-${String(this.seq++).padStart(3, '0')}`,
      intermediateStops: [...data.intermediateStops],
      legs: [...data.legs],
      createdAt: new Date().toISOString(),
    };
    this.routes.unshift(record);
    this.notify();
    return record;
  }

  deleteRoute(id: string): void {
    this.routes = this.routes.filter((r) => r.id !== id);
    this.notify();
  }
}

export const SavedRouteService = new SavedRouteServiceClass();

export function formatRouteShareText(route: {
  lorryRegistration: string;
  startLocation: RouteLocation;
  destination: RouteLocation;
  intermediateStops: RouteLocation[];
  distanceKm: number;
  durationLabel: string;
  legs: SavedRouteLeg[];
  formatLegDuration: (sec: number) => string;
}): string {
  const lines = [
    `FleetOS Planned Route — ${route.lorryRegistration}`,
    `Start: ${route.startLocation.shortName}`,
    ...(route.intermediateStops.length > 0
      ? [`Stops: ${route.intermediateStops.map((s) => s.shortName).join(' -> ')}`]
      : []),
    `Destination: ${route.destination.shortName}`,
    `Total Road Distance: ${route.distanceKm.toLocaleString('en-IN')} km`,
    `Estimated Duration: ${route.durationLabel} (Estimate)`,
    '',
    'Stop-by-stop breakdown:',
    ...route.legs.map(
      (leg, i) =>
        `${i + 1}. ${leg.from} -> ${leg.to}: ${leg.distanceKm.toLocaleString('en-IN')} km (Est. ${route.formatLegDuration(leg.durationSeconds)})`
    ),
  ];
  return lines.join('\n');
}
