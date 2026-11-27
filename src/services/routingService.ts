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
interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name?: string;
    city?: string;
    town?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    street?: string;
    postcode?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

const formatPhotonFeature = (f: PhotonFeature): RouteLocation => {
  const p = f.properties;
  const primary = p.name || p.city || p.town || p.district || p.street || 'Unknown location';
  const shortParts = [primary];
  if (p.city && p.city !== primary) shortParts.push(p.city);
  else if (p.state && !primary.includes(p.state)) shortParts.push(p.state);
  const fullParts = [primary, p.city, p.district, p.state, p.country].filter(
    (v, i, arr) => Boolean(v) && arr.indexOf(v) === i
  );
  return {
    shortName: shortParts.join(', '),
    label: fullParts.join(', '),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  };
};

/**
 * Search cities, towns, areas, and addresses via OpenStreetMap geocoding
 * (Photon by Komoot with Nominatim fallback). Prioritizes India results for FleetOS.
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<RouteLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Internet connection unavailable. Please reconnect to search locations.');
  }

  const fetchWithTimeout = async (url: string): Promise<Response> => {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), 12_000);
    const onExternalAbort = () => timeoutController.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });
    try {
      return await fetch(url, {
        signal: timeoutController.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (err) {
      if (signal?.aborted) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new Error('Location search timed out. Please try again.');
      }
      throw new Error('Unable to reach location search service. Check your internet connection.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onExternalAbort);
    }
  };

  // Primary: OpenStreetMap Photon (biased to India center: 20.59, 78.96)
  const photonParams = new URLSearchParams({
    q: trimmed,
    limit: '6',
    lat: '20.5937',
    lon: '78.9629',
  });
  const photonRes = await fetchWithTimeout(
    `https://photon.komoot.io/api/?${photonParams.toString()}`
  );
  if (photonRes.ok) {
    const data = (await photonRes.json()) as PhotonResponse;
    const features = data.features ?? [];
    // Prioritize India results when available
    const indiaFirst = [
      ...features.filter((f) => f.properties.countrycode?.toUpperCase() === 'IN'),
      ...features.filter((f) => f.properties.countrycode?.toUpperCase() !== 'IN'),
    ];
    return indiaFirst.slice(0, 5).map(formatPhotonFeature);
  }

  // Fallback: OpenStreetMap Nominatim
  const nomParams = new URLSearchParams({
    q: trimmed,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'in',
  });
  const nomRes = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/search?${nomParams.toString()}`
  );
  if (!nomRes.ok) {
    throw new Error(`Location search service failed (HTTP ${nomRes.status}).`);
  }
  const nomData = (await nomRes.json()) as NominatimResult[];
  return nomData.map((r) => ({
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
  signal?: AbortSignal,
  timeoutMs: number = 15_000
): Promise<RoutedPathResult[]> {
  if (waypoints.length < 2) {
    throw new Error('At least a starting location and final destination are required.');
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('No internet connection detected. Reconnect to calculate road routes.');
  }

  for (const w of waypoints) {
    if (
      !Number.isFinite(w.lat) ||
      !Number.isFinite(w.lng) ||
      w.lat < -90 ||
      w.lat > 90 ||
      w.lng < -180 ||
      w.lng > 180
    ) {
      throw new Error(`Invalid coordinates for location "${w.shortName}". Please re-select it.`);
    }
  }

  // Reject consecutive duplicate stops (same coordinates within ~100m)
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    if (Math.abs(prev.lat - curr.lat) < 0.001 && Math.abs(prev.lng - curr.lng) < 0.001) {
      throw new Error(
        `Duplicate consecutive locations detected ("${prev.shortName}" and "${curr.shortName}"). Please select distinct stops.`
      );
    }
  }

  const coordString = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const alternativesParam = waypoints.length === 2 ? '&alternatives=true' : '&alternatives=false';
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson${alternativesParam}`;

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  const onExternalAbort = () => timeoutController.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(url, { signal: timeoutController.signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new Error('Route calculation timed out. The routing server took too long to respond.');
    }
    throw new Error('Routing API is unreachable. Please check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  if (!res.ok) {
    throw new Error(`OSRM routing service returned HTTP ${res.status}. Please try again shortly.`);
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

  // Primary: OpenStreetMap Photon reverse geocoder
  const photonRes = await fetch(
    `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
    { signal, headers: { Accept: 'application/json' } }
  );
  if (photonRes.ok) {
    const data = (await photonRes.json()) as PhotonResponse;
    const first = data.features?.[0];
    const label = first ? formatPhotonFeature(first).shortName : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    reverseGeocodeCache.set(cacheKey, label);
    return label;
  }

  // Fallback: OpenStreetMap Nominatim
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
