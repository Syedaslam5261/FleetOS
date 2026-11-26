import { TripDieselRecord, TripStatus } from '../types/tripDiesel';

/**
 * DEMO DATA ONLY.
 * Deterministic trip-wise actual diesel records across 2024, 2025, and 2026 so
 * Daily, Weekly, Monthly, and Yearly filters all calculate from the exact same
 * underlying trip records.
 *
 * - Every record belongs to a single lorryId (`LR-001`..`LR-006`).
 * - `LR-007` (GJ 18 GH 5566) intentionally has 0 trips to demonstrate empty states.
 * - `2026-11-25` has multiple trips on the same day per active lorry so Daily view
 *   shows multiple trips and trip-wise chart bars immediately.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

interface LorryRouteSeed {
  lorryId: string;
  driver: string;
  station: string;
  mileage: number;
  baseRate: number;
  routes: Array<{ from: string; to: string; km: number }>;
}

const SEEDS: LorryRouteSeed[] = [
  {
    lorryId: 'LR-001',
    driver: 'Sukhwinder Singh',
    station: 'IndianOil COCO, Shirwal NH-48',
    mileage: 3.9,
    baseRate: 91.5,
    routes: [
      { from: 'Mumbai', to: 'Pune', km: 152 },
      { from: 'Pune', to: 'Kolhapur', km: 234 },
      { from: 'Kolhapur', to: 'Hubballi', km: 186 },
      { from: 'Mumbai', to: 'Bengaluru', km: 984 },
      { from: 'Bengaluru', to: 'Pune', km: 842 },
    ],
  },
  {
    lorryId: 'LR-002',
    driver: 'Rajesh Sharma',
    station: 'HPCL Auto Care, Vapi NH-48',
    mileage: 3.8,
    baseRate: 92.2,
    routes: [
      { from: 'Surat', to: 'Vapi', km: 118 },
      { from: 'Vapi', to: 'Mumbai', km: 174 },
      { from: 'Mumbai', to: 'Nashik', km: 168 },
      { from: 'Surat', to: 'Ahmedabad', km: 266 },
      { from: 'Ahmedabad', to: 'Mumbai', km: 526 },
    ],
  },
  {
    lorryId: 'LR-003',
    driver: 'Ramesh Patil',
    station: 'BPCL Fuel Oasis, Hosur NH-44',
    mileage: 3.2,
    baseRate: 90.8,
    routes: [
      { from: 'Bengaluru', to: 'Hosur', km: 44 },
      { from: 'Hosur', to: 'Krishnagiri', km: 56 },
      { from: 'Bengaluru', to: 'Chennai', km: 348 },
      { from: 'Chennai', to: 'Bengaluru', km: 352 },
      { from: 'Bengaluru', to: 'Coimbatore', km: 364 },
    ],
  },
  {
    lorryId: 'LR-004',
    driver: 'Imran Khan',
    station: 'IndianOil, Medchal ORR',
    mileage: 3.8,
    baseRate: 91.1,
    routes: [
      { from: 'Hyderabad', to: 'Suryapet', km: 138 },
      { from: 'Suryapet', to: 'Vijayawada', km: 136 },
      { from: 'Hyderabad', to: 'Warangal', km: 148 },
      { from: 'Hyderabad', to: 'Vijayawada', km: 274 },
      { from: 'Vijayawada', to: 'Hyderabad', km: 276 },
    ],
  },
  {
    lorryId: 'LR-005',
    driver: 'Vijay Kumar',
    station: 'Reliance Jio-bp, Nellore NH-16',
    mileage: 3.85,
    baseRate: 91.0,
    routes: [
      { from: 'Vijayawada', to: 'Ongole', km: 146 },
      { from: 'Ongole', to: 'Nellore', km: 134 },
      { from: 'Nellore', to: 'Chennai Port', km: 176 },
      { from: 'Vijayawada', to: 'Chennai Port', km: 454 },
      { from: 'Chennai Port', to: 'Vijayawada', km: 458 },
    ],
  },
  {
    lorryId: 'LR-006',
    driver: 'Arjun Reddy',
    station: 'HPCL, Sriperumbudur',
    mileage: 4.6,
    baseRate: 90.4,
    routes: [
      { from: 'Chennai', to: 'Sriperumbudur', km: 42 },
      { from: 'Sriperumbudur', to: 'Vellore', km: 96 },
      { from: 'Chennai', to: 'Salem', km: 342 },
      { from: 'Salem', to: 'Coimbatore', km: 168 },
      { from: 'Coimbatore', to: 'Chennai', km: 506 },
    ],
  },
];

function makeTrip(
  seq: number,
  seed: LorryRouteSeed,
  routeIdx: number,
  tripDate: string,
  rateOffset: number,
  status: TripStatus = 'Completed',
  notes?: string
): TripDieselRecord {
  const route = seed.routes[routeIdx % seed.routes.length];
  const dieselLitres = round2(route.km / seed.mileage);
  const dieselPricePerL = round2(seed.baseRate + rateOffset);
  const totalDieselCost = round2(dieselLitres * dieselPricePerL);
  const yr = tripDate.slice(0, 4);

  return {
    id: `TRP-${yr}-${String(seq).padStart(4, '0')}`,
    lorryId: seed.lorryId,
    startLocation: route.from,
    destination: route.to,
    tripDate,
    distanceKm: route.km,
    dieselLitres,
    dieselPricePerL,
    totalDieselCost,
    status,
    driverName: seed.driver,
    fuelStation: seed.station,
    receiptNo: `RCP-${seed.lorryId.slice(-3)}-${String(seq).padStart(4, '0')}`,
    notes,
  };
}

function buildDemoTrips(): TripDieselRecord[] {
  const out: TripDieselRecord[] = [];
  let seq = 1001;

  for (const seed of SEEDS) {
    // 1. Multiple trips on the default reference day (2026-11-25) for rich Daily view
    out.push(makeTrip(seq++, seed, 0, '2026-11-25', 0.2, 'Completed', 'Morning dispatch leg — full tank verified'));
    out.push(makeTrip(seq++, seed, 1, '2026-11-25', 0.25, 'Completed', 'Afternoon onward leg'));
    out.push(makeTrip(seq++, seed, 2, '2026-11-25', 0.3, 'In Transit', 'Evening delivery run'));

    // 2. Other days in the same week (2026-11-23 to 2026-11-29) for rich Weekly view
    out.push(makeTrip(seq++, seed, 3, '2026-11-23', 0.1, 'Completed'));
    out.push(makeTrip(seq++, seed, 1, '2026-11-24', 0.15, 'Completed'));
    out.push(makeTrip(seq++, seed, 4, '2026-11-26', 0.35, 'In Transit'));

    // 3. Earlier weeks in November 2026 for rich Monthly view
    const novDates = ['2026-11-02', '2026-11-05', '2026-11-09', '2026-11-12', '2026-11-16', '2026-11-19'];
    novDates.forEach((dt, idx) => {
      out.push(makeTrip(seq++, seed, idx + 2, dt, (idx - 2) * 0.1, 'Completed'));
    });

    // 4. Other months of 2026 (Jan–Oct 2026) for Yearly 2026 view
    for (let m = 1; m <= 10; m++) {
      const mm = String(m).padStart(2, '0');
      out.push(makeTrip(seq++, seed, m % 5, `2026-${mm}-08`, (m - 6) * 0.12, 'Completed'));
      out.push(makeTrip(seq++, seed, (m + 2) % 5, `2026-${mm}-21`, (m - 5) * 0.12, 'Completed'));
    }

    // 5. Full year 2025 (Jan–Dec 2025) for Yearly comparison
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      out.push(makeTrip(seq++, seed, (m + 1) % 5, `2025-${mm}-11`, -1.2 + m * 0.08, 'Completed'));
      out.push(makeTrip(seq++, seed, (m + 3) % 5, `2025-${mm}-24`, -1.1 + m * 0.08, 'Completed'));
    }

    // 6. Selected months in 2024
    for (const m of [6, 8, 10, 12]) {
      const mm = String(m).padStart(2, '0');
      out.push(makeTrip(seq++, seed, m % 5, `2024-${mm}-15`, -2.0 + m * 0.05, 'Completed'));
    }
  }

  return out.sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.id.localeCompare(a.id));
}

export const TRIP_DIESEL_RECORDS: TripDieselRecord[] = buildDemoTrips();

export const DEFAULT_TRIP_REFERENCE_DATE = '2026-11-25';
