import {
  EngineVehicleStatus,
  GpsConnectionStatus,
  GpsTelemetryPoint,
  IgnitionTelemetry,
  JourneyAlert,
  JourneyStopRecord,
  LorryJourneyTelemetry,
} from '../types/gpsTracking';

const EARTH_RADIUS_KM = 6371;
const STATIONARY_SPEED_THRESHOLD_KMH = 2;
const STATIONARY_RADIUS_KM = 0.12; // 120m GPS drift tolerance

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Sum of GPS-tracked travelled distance across chronologically ordered telemetry points.
 */
export function calculateTrackedDistanceKm(points: GpsTelemetryPoint[]): number {
  if (points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += haversineDistanceKm(
      sorted[i - 1].lat,
      sorted[i - 1].lng,
      sorted[i].lat,
      sorted[i].lng
    );
  }
  return Math.round(total * 10) / 10;
}

export function classifyGpsConnection(
  journey: LorryJourneyTelemetry | undefined,
  nowMs: number
): { status: GpsConnectionStatus; ageMinutes: number | null } {
  if (!journey || journey.points.length === 0) {
    return { status: 'UNAVAILABLE', ageMinutes: null };
  }
  const sorted = [...journey.points].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const latest = sorted[sorted.length - 1];
  const latestMs = new Date(latest.recordedAt).getTime();
  const ageMinutes = Math.max(0, Math.round((nowMs - latestMs) / 60000));

  if (!journey.deviceConnected) {
    return { status: 'OFFLINE', ageMinutes };
  }
  if (ageMinutes > journey.staleThresholdMinutes * 3) {
    return { status: 'OFFLINE', ageMinutes };
  }
  if (ageMinutes > journey.staleThresholdMinutes) {
    return { status: 'STALE', ageMinutes };
  }
  return { status: 'LIVE', ageMinutes };
}

/**
 * Derives Engine and Vehicle Status strictly from verified telemetry.
 * CRITICAL: Never assumes Engine OFF just because speed === 0 when ignition telemetry is UNAVAILABLE.
 */
export function deriveEngineVehicleStatus(
  gpsStatus: GpsConnectionStatus,
  latestPoint: GpsTelemetryPoint | undefined
): { status: EngineVehicleStatus; detailNote: string } {
  if (gpsStatus === 'UNAVAILABLE' || !latestPoint) {
    return {
      status: 'GPS Unavailable',
      detailNote: 'No GPS telemetry device or verified coordinates available.',
    };
  }
  if (gpsStatus === 'OFFLINE') {
    return {
      status: 'GPS Offline',
      detailNote: 'GPS tracker is disconnected; live engine & movement state cannot be confirmed.',
    };
  }

  // Confirmed Ignition OFF from actual ignition telemetry
  if (latestPoint.ignition === 'OFF') {
    return {
      status: 'Engine OFF',
      detailNote: 'Confirmed by ignition telemetry sensor.',
    };
  }

  const isStationary =
    latestPoint.speedKmh !== null && latestPoint.speedKmh <= STATIONARY_SPEED_THRESHOLD_KMH;

  if (isStationary) {
    if (latestPoint.ignition === 'ON') {
      return {
        status: 'Vehicle Stationary',
        detailNote: 'Vehicle stationary (0 km/h) with Engine Running (idling) confirmed by ignition sensor.',
      };
    }
    return {
      status: 'Vehicle Stationary',
      detailNote:
        'Vehicle stationary (speed 0 km/h). Ignition telemetry unavailable — engine is NOT assumed OFF.',
    };
  }

  if (latestPoint.ignition === 'ON') {
    return {
      status: 'Engine Running',
      detailNote: 'Ignition ON confirmed by telemetry sensor.',
    };
  }

  return {
    status: 'Engine Running',
    detailNote:
      latestPoint.speedKmh !== null
        ? `Vehicle moving at ${latestPoint.speedKmh} km/h (ignition sensor unavailable).`
        : 'GPS active; ignition sensor unavailable.',
  };
}

/**
 * Detects verified stops from chronological GPS telemetry points using the configurable
 * `minStopDurationMinutes` threshold so traffic signals & brief traffic pauses are excluded.
 */
export function detectStopsFromHistory(
  points: GpsTelemetryPoint[],
  minStopDurationMinutes: number,
  longStopAlertMinutes: number,
  nowMs: number
): JourneyStopRecord[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  const stops: JourneyStopRecord[] = [];
  let cluster: GpsTelemetryPoint[] = [];

  const finalizeCluster = (isOngoing: boolean) => {
    if (cluster.length === 0) return;
    const first = cluster[0];
    const last = cluster[cluster.length - 1];
    const startMs = new Date(first.recordedAt).getTime();
    const endMs = isOngoing ? Math.max(nowMs, new Date(last.recordedAt).getTime()) : new Date(last.recordedAt).getTime();
    const durationMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));

    if (durationMinutes >= minStopDurationMinutes) {
      // Determine ignition status: OFF if any point confirmed OFF, ON if confirmed ON, else UNAVAILABLE
      let ignitionStatus: IgnitionTelemetry = 'UNAVAILABLE';
      if (cluster.some((p) => p.ignition === 'OFF')) ignitionStatus = 'OFF';
      else if (cluster.some((p) => p.ignition === 'ON')) ignitionStatus = 'ON';

      stops.push({
        id: `STP-${first.tripId}-${stops.length + 1}`,
        lorryId: first.lorryId,
        tripId: first.tripId,
        lat: first.lat,
        lng: first.lng,
        locationLabel:
          first.areaLabel || `${first.lat.toFixed(4)}, ${first.lng.toFixed(4)}`,
        startTime: first.recordedAt,
        endTime: isOngoing ? null : last.recordedAt,
        durationMinutes,
        ignitionStatus,
        status: isOngoing ? 'Current' : 'Completed',
        isLongStop: durationMinutes >= longStopAlertMinutes,
      });
    }
    cluster = [];
  };

  for (let i = 0; i < sorted.length; i++) {
    const pt = sorted[i];
    const isStationaryPt =
      pt.speedKmh !== null && pt.speedKmh <= STATIONARY_SPEED_THRESHOLD_KMH;

    if (!isStationaryPt) {
      finalizeCluster(false);
      continue;
    }

    if (cluster.length === 0) {
      cluster.push(pt);
    } else {
      const anchor = cluster[0];
      const dist = haversineDistanceKm(anchor.lat, anchor.lng, pt.lat, pt.lng);
      if (dist <= STATIONARY_RADIUS_KM) {
        cluster.push(pt);
      } else {
        finalizeCluster(false);
        cluster.push(pt);
      }
    }
  }

  // If the lorry's latest point is still stationary, mark stop as Current (ongoing)
  finalizeCluster(true);

  return stops.sort((a, b) => b.startTime.localeCompare(a.startTime));
}

export function generateJourneyAlerts(
  journey: LorryJourneyTelemetry | undefined,
  gpsStatus: GpsConnectionStatus,
  ageMinutes: number | null,
  latestPoint: GpsTelemetryPoint | undefined,
  stops: JourneyStopRecord[],
  nowIso: string
): JourneyAlert[] {
  if (!journey) return [];
  const alerts: JourneyAlert[] = [];

  if (gpsStatus === 'OFFLINE') {
    alerts.push({
      id: `ALT-OFFLINE-${journey.lorryId}`,
      severity: 'critical',
      type: 'GPS_OFFLINE',
      title: 'GPS Device Disconnected',
      message: `Tracker ${journey.deviceId ?? 'device'} is offline${ageMinutes !== null ? ` (last verified signal ${ageMinutes} min ago)` : ''}. Live position cannot be verified.`,
      timestamp: latestPoint?.recordedAt ?? nowIso,
    });
  } else if (gpsStatus === 'STALE') {
    alerts.push({
      id: `ALT-STALE-${journey.lorryId}`,
      severity: 'warning',
      type: 'GPS_STALE',
      title: 'GPS Data Becoming Stale',
      message: `Last verified GPS ping was ${ageMinutes} minutes ago (threshold: ${journey.staleThresholdMinutes} min).`,
      timestamp: latestPoint?.recordedAt ?? nowIso,
    });
  }

  if (gpsStatus !== 'OFFLINE' && latestPoint && latestPoint.ignition === 'OFF') {
    alerts.push({
      id: `ALT-IGNOFF-${latestPoint.id}`,
      severity: 'warning',
      type: 'ENGINE_OFF_IN_TRIP',
      title: 'Engine Switched OFF During Trip',
      message: `Ignition telemetry confirmed Engine OFF at ${latestPoint.areaLabel ?? `${latestPoint.lat.toFixed(4)}, ${latestPoint.lng.toFixed(4)}`}.`,
      timestamp: latestPoint.recordedAt,
    });
  }

  for (const s of stops) {
    if (s.isLongStop) {
      alerts.push({
        id: `ALT-LONGSTOP-${s.id}`,
        severity: s.status === 'Current' ? 'critical' : 'warning',
        type: 'LONG_STOP',
        title:
          s.status === 'Current'
            ? `Unexpected Long Stop Ongoing (${s.durationMinutes} min)`
            : `Long Stop Recorded (${s.durationMinutes} min)`,
        message: `Stationary at ${s.locationLabel} (threshold: ${journey.longStopAlertMinutes} min). Ignition: ${s.ignitionStatus}.`,
        timestamp: s.startTime,
      });
    }
  }

  return alerts;
}

export function formatStopDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
