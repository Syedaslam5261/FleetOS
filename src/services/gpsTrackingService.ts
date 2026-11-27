import { GpsTelemetryPoint, LorryJourneyTelemetry } from '../types/gpsTracking';

type Listener = () => void;

const minsAgo = (baseMs: number, mins: number) =>
  new Date(baseMs - mins * 60_000).toISOString();

function buildSeedJourneys(nowMs: number): LorryJourneyTelemetry[] {
  return [
    // LR-001 (MH 12 RN 4821): LIVE GPS, Mumbai -> Bengaluru (NH-48)
    // Includes: 3-min traffic signal pause (filtered out at 10-min default),
    // 42-min completed long stop at Kolhapur (Ignition OFF), and 16-min ongoing stop at Tumakuru (Ignition ON).
    {
      lorryId: 'LR-001',
      tripId: 'TRP-2026-101',
      startLocation: { name: 'Bhiwandi Logistics Park, Mumbai', lat: 19.2813, lng: 73.0483 },
      destination: { name: 'Nelamangala Hub, Bengaluru', lat: 13.0987, lng: 77.3929 },
      deviceConnected: true,
      deviceId: 'GPS-TEL-4821',
      staleThresholdMinutes: 15,
      minStopDurationMinutes: 10,
      longStopAlertMinutes: 30,
      isDemoSeed: true,
      points: [
        { id: 'PT-101-1', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 19.2813, lng: 73.0483, speedKmh: 48, ignition: 'ON', recordedAt: minsAgo(nowMs, 780), areaLabel: 'Bhiwandi Logistics Park, Mumbai', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-2', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 18.7557, lng: 73.4091, speedKmh: 58, ignition: 'ON', recordedAt: minsAgo(nowMs, 690), areaLabel: 'Lonavala Expressway, MH', source: 'DEMO_TELEMETRY' },
        // Short 3-minute traffic signal delay in Pune (must NOT be marked as a stop when threshold is 10 min)
        { id: 'PT-101-3', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 18.5204, lng: 73.8567, speedKmh: 0, ignition: 'ON', recordedAt: minsAgo(nowMs, 620), areaLabel: 'Katraj Signal, Pune', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-4', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 18.5205, lng: 73.8568, speedKmh: 0, ignition: 'ON', recordedAt: minsAgo(nowMs, 617), areaLabel: 'Katraj Signal, Pune', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-5', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 17.6805, lng: 74.0183, speedKmh: 62, ignition: 'ON', recordedAt: minsAgo(nowMs, 510), areaLabel: 'Satara NH-48, MH', source: 'DEMO_TELEMETRY' },
        // 42-minute completed long stop at Kolhapur Highway Dhaba (Ignition OFF)
        { id: 'PT-101-6', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 16.705, lng: 74.2433, speedKmh: 0, ignition: 'OFF', recordedAt: minsAgo(nowMs, 412), areaLabel: 'Kolhapur Highway Dhaba, NH-48', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-7', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 16.7051, lng: 74.2434, speedKmh: 0, ignition: 'OFF', recordedAt: minsAgo(nowMs, 370), areaLabel: 'Kolhapur Highway Dhaba, NH-48', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-8', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 15.8497, lng: 74.4977, speedKmh: 60, ignition: 'ON', recordedAt: minsAgo(nowMs, 280), areaLabel: 'Belagavi Bypass, KA', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-9', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 14.4644, lng: 75.9218, speedKmh: 56, ignition: 'ON', recordedAt: minsAgo(nowMs, 145), areaLabel: 'Davanagere NH-48, KA', source: 'DEMO_TELEMETRY' },
        // Current 16-minute stationary stop near Tumakuru (Ignition ON - idling)
        { id: 'PT-101-10', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 13.3379, lng: 77.1173, speedKmh: 0, ignition: 'ON', recordedAt: minsAgo(nowMs, 16), areaLabel: 'Tumakuru NH-48 Checkpost, KA', source: 'DEMO_TELEMETRY' },
        { id: 'PT-101-11', lorryId: 'LR-001', tripId: 'TRP-2026-101', lat: 13.338, lng: 77.1174, speedKmh: 0, ignition: 'ON', recordedAt: minsAgo(nowMs, 2), areaLabel: 'Tumakuru NH-48 Checkpost, KA', source: 'DEMO_TELEMETRY' },
      ],
    },

    // LR-002 (NL 01 AA 6512): STALE GPS (26 min old), speed 0, ignition UNAVAILABLE
    // Demonstrates strict rule: never assume Engine OFF from speed === 0 when ignition is unavailable.
    {
      lorryId: 'LR-002',
      tripId: 'TRP-2026-204',
      startLocation: { name: 'Pandesara GIDC, Surat', lat: 21.1458, lng: 72.8311 },
      destination: { name: 'Kalamboli Warehouse, Navi Mumbai', lat: 19.033, lng: 73.103 },
      deviceConnected: true,
      deviceId: 'GPS-TEL-6512',
      staleThresholdMinutes: 15,
      minStopDurationMinutes: 10,
      longStopAlertMinutes: 30,
      isDemoSeed: true,
      points: [
        { id: 'PT-204-1', lorryId: 'LR-002', tripId: 'TRP-2026-204', lat: 21.1458, lng: 72.8311, speedKmh: 52, ignition: 'UNAVAILABLE', recordedAt: minsAgo(nowMs, 190), areaLabel: 'Pandesara GIDC, Surat', source: 'DEMO_TELEMETRY' },
        { id: 'PT-204-2', lorryId: 'LR-002', tripId: 'TRP-2026-204', lat: 20.3893, lng: 72.9106, speedKmh: 0, ignition: 'UNAVAILABLE', recordedAt: minsAgo(nowMs, 50), areaLabel: 'Vapi NH-48 Toll Plaza, GJ', source: 'DEMO_TELEMETRY' },
        { id: 'PT-204-3', lorryId: 'LR-002', tripId: 'TRP-2026-204', lat: 20.3894, lng: 72.9107, speedKmh: 0, ignition: 'UNAVAILABLE', recordedAt: minsAgo(nowMs, 26), areaLabel: 'Vapi NH-48 Toll Plaza, GJ', source: 'DEMO_TELEMETRY' },
      ],
    },

    // LR-003 (KA 04 D 7712): GPS OFFLINE (device disconnected)
    {
      lorryId: 'LR-003',
      tripId: 'TRP-2026-305',
      startLocation: { name: 'Peenya Industrial Area, Bengaluru', lat: 13.0285, lng: 77.5197 },
      destination: { name: 'Sriperumbudur Hub, Chennai', lat: 12.9675, lng: 79.9419 },
      deviceConnected: false,
      deviceId: 'GPS-TEL-7712',
      staleThresholdMinutes: 15,
      minStopDurationMinutes: 10,
      longStopAlertMinutes: 30,
      isDemoSeed: true,
      points: [
        { id: 'PT-305-1', lorryId: 'LR-003', tripId: 'TRP-2026-305', lat: 13.0285, lng: 77.5197, speedKmh: 54, ignition: 'ON', recordedAt: minsAgo(nowMs, 180), areaLabel: 'Peenya, Bengaluru', source: 'DEMO_TELEMETRY' },
        { id: 'PT-305-2', lorryId: 'LR-003', tripId: 'TRP-2026-305', lat: 12.7409, lng: 77.8253, speedKmh: 46, ignition: 'ON', recordedAt: minsAgo(nowMs, 95), areaLabel: 'Hosur NH-44, TN', source: 'DEMO_TELEMETRY' },
      ],
    },

    // LR-005 (AP 39 CD 9087): LIVE moving truck, Engine Running, no long stops
    {
      lorryId: 'LR-005',
      tripId: 'TRP-2026-501',
      startLocation: { name: 'Autonagar, Vijayawada', lat: 16.4971, lng: 80.6697 },
      destination: { name: 'Chennai Port Gate, Chennai', lat: 13.0843, lng: 80.2896 },
      deviceConnected: true,
      deviceId: 'GPS-TEL-9087',
      staleThresholdMinutes: 15,
      minStopDurationMinutes: 10,
      longStopAlertMinutes: 30,
      isDemoSeed: true,
      points: [
        { id: 'PT-501-1', lorryId: 'LR-005', tripId: 'TRP-2026-501', lat: 16.4971, lng: 80.6697, speedKmh: 58, ignition: 'ON', recordedAt: minsAgo(nowMs, 260), areaLabel: 'Autonagar, Vijayawada', source: 'DEMO_TELEMETRY' },
        { id: 'PT-501-2', lorryId: 'LR-005', tripId: 'TRP-2026-501', lat: 15.5057, lng: 80.0499, speedKmh: 64, ignition: 'ON', recordedAt: minsAgo(nowMs, 140), areaLabel: 'Ongole Bypass, NH-16', source: 'DEMO_TELEMETRY' },
        { id: 'PT-501-3', lorryId: 'LR-005', tripId: 'TRP-2026-501', lat: 14.4426, lng: 79.9865, speedKmh: 61, ignition: 'ON', recordedAt: minsAgo(nowMs, 3), areaLabel: 'Nellore NH-16, AP', source: 'DEMO_TELEMETRY' },
      ],
    },
  ];
}

/**
 * Lorry-isolated GPS telemetry store.
 * LR-007 (and any lorry without a GPS device) returns `undefined` -> GPS Unavailable state.
 */
class GpsTrackingServiceClass {
  private journeys: LorryJourneyTelemetry[] = buildSeedJourneys(Date.now());
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getJourney(lorryId: string): LorryJourneyTelemetry | undefined {
    const found = this.journeys.find((j) => j.lorryId === lorryId);
    if (!found) return undefined;
    return { ...found, points: [...found.points] };
  }

  updateThresholds(
    lorryId: string,
    updates: Partial<Pick<LorryJourneyTelemetry, 'minStopDurationMinutes' | 'longStopAlertMinutes' | 'staleThresholdMinutes'>>
  ): void {
    const idx = this.journeys.findIndex((j) => j.lorryId === lorryId);
    if (idx === -1) return;
    this.journeys[idx] = { ...this.journeys[idx], ...updates };
    this.notify();
  }

  appendTelemetryPoint(lorryId: string, point: GpsTelemetryPoint): void {
    const idx = this.journeys.findIndex((j) => j.lorryId === lorryId);
    if (idx === -1 || point.lorryId !== lorryId) return;
    this.journeys[idx] = {
      ...this.journeys[idx],
      deviceConnected: true,
      points: [...this.journeys[idx].points, point],
    };
    this.notify();
  }
}

export const GpsTrackingService = new GpsTrackingServiceClass();
