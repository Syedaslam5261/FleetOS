import { RouteLocation, RoutedPathResult } from '../types/fuel';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
  };
}

interface OsrmRouteResponse {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number; // meters
    duration: number; // seconds
    geometry: {
      type: 'LineString';
      coordinates: Array<[number, number]>; // [lng, lat]
    };
    legs: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

const shortLabelFromNominatim = (item: NominatimResult): string => {
  const primary =
    item.name ||
    item.address?.city ||
    item.address?.town ||
    item.address?.village ||
    item.address?.suburb ||
    item.display_name.split(',')[0];
  const state = item.address?.state;
  return state && !primary.includes(state) ? `${primary}, ${state}` : primary;
};

/**
 * Search cities, towns, areas, and addresses via OpenStreetMap Nominatim.
 * Prioritizes India results for FleetOS, falling back to global search if none match.
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<RouteLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const fetchNominatim = async (countryCodes?: string): Promise<NominatimResult[]> => {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      addressdetails: '1',
      limit: '5',
    });
    if (countryCodes) params.set('countrycodes', countryCodes);

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Location search failed (HTTP ${res.status})`);
    return (await res.json()) as NominatimResult[];
  };

  let results = await fetchNominatim('in');
  if (results.length === 0) {
    results = await fetchNominatim();
  }

  return results.map((r) => ({
    label: r.display_name,
    shortName: shortLabelFromNominatim(r),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

/**
 * Calculate actual road distance and geometry across ordered waypoints using OSRM.
 * Never fabricates distances; throws a descriptive error if routing fails or no road route exists.
 */
export async function fetchRoadRoute(
  waypoints: RouteLocation[],
  signal?: AbortSignal
): Promise<RoutedPathResult> {
  const routes = await fetchRoadRouteAlternatives(waypoints, signal);
  return routes[0];
}

/**
 * Calculate actual road route(s) including alternatives (when supported by OSRM)
 * across ordered waypoints. Never fabricates or falls back to straight-line distance.
 */
export async function fetchRoadRouteAlternatives(
  waypoints: RouteLocation[],
  signal?: AbortSignal
): Promise<RoutedPathResult[]> {
  if (waypoints.length < 2) {
    throw new Error('At least a starting location and final destination are required.');
  }

  for (const w of waypoints) {
    if (!Number.isFinite(w.lat) || !Number.isFinite(w.lng)) {
      throw new Error(`Invalid coordinates for location "${w.shortName}". Please re-select it.`);
    }
  }

  const coordString = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const alternativesParam = waypoints.length === 2 ? '&alternatives=true' : '&alternatives=false';
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson${alternativesParam}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`OSRM routing service returned HTTP ${res.status}.`);
  }

  const data = (await res.json()) as OsrmRouteResponse;
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(data.message || 'No drivable road route was found between the selected locations.');
  }

  return data.routes.map((route) => {
    const coordinates: Array<[number, number]> = route.geometry.coordinates.map(([lng, lat]) => [
      lat,
      lng,
    ]);
    const legs = route.legs.map((leg, i) => ({
      from: waypoints[i]?.shortName ?? `Stop ${i + 1}`,
      to: waypoints[i + 1]?.shortName ?? `Stop ${i + 2}`,
      distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
      durationSeconds: leg.duration,
    }));

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationSeconds: route.duration,
      coordinates,
      legs,
    };
  });
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

const reverseGeocodeCache = new Map<string, string>();

/**
 * Reverse geocode verified GPS coordinates into a human-readable area/address
 * using OpenStreetMap Nominatim. Results are cached by ~100m grid key to respect rate limits.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
    zoom: '14',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed (HTTP ${res.status})`);
  }

  const data = (await res.json()) as NominatimResult;
  const label = data.display_name
    ? shortLabelFromNominatim(data)
    : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  reverseGeocodeCache.set(cacheKey, label);
  return label;
}
