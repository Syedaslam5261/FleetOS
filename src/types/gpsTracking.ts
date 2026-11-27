export type GpsConnectionStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE';

export type IgnitionTelemetry = 'ON' | 'OFF' | 'UNAVAILABLE';

export type EngineVehicleStatus =
  | 'Engine Running'
  | 'Engine OFF'
  | 'Vehicle Stationary'
  | 'GPS Offline'
  | 'GPS Unavailable';

export interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface GpsTelemetryPoint {
  id: string;
  lorryId: string;
  tripId: string;
  lat: number;
  lng: number;
  /** null when GPS device does not report speed */
  speedKmh: number | null;
  headingDeg?: number;
  /** Real ignition telemetry only; never inferred from speed === 0 */
  ignition: IgnitionTelemetry;
  recordedAt: string; // ISO UTC
  /** Optional area label cached from reverse geocoding or verified checkpoint */
  areaLabel?: string;
  source: 'GPS_DEVICE' | 'DEMO_TELEMETRY';
}

export interface JourneyStopRecord {
  id: string;
  lorryId: string;
  tripId: string;
  lat: number;
  lng: number;
  locationLabel: string;
  startTime: string; // ISO UTC
  /** null while the lorry is currently stopped here */
  endTime: string | null;
  durationMinutes: number;
  ignitionStatus: IgnitionTelemetry;
  status: 'Current' | 'Completed';
  isLongStop: boolean;
}

export interface JourneyAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'LONG_STOP' | 'ENGINE_OFF_IN_TRIP' | 'GPS_OFFLINE' | 'GPS_STALE';
  title: string;
  message: string;
  timestamp: string;
}

export interface LorryJourneyTelemetry {
  lorryId: string;
  tripId: string;
  startLocation: GeoPoint;
  destination: GeoPoint;
  deviceConnected: boolean;
  deviceId?: string;
  /** Minutes after which GPS without a fresh update is marked STALE */
  staleThresholdMinutes: number;
  /** Minimum stationary duration (minutes) before marking a red Stop marker */
  minStopDurationMinutes: number;
  /** Stationary duration (minutes) that triggers an Unexpected Long Stop alert */
  longStopAlertMinutes: number;
  isDemoSeed: boolean;
  points: GpsTelemetryPoint[];
}
