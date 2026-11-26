import {
  LorryDieselRecord,
  LorryExpense,
  LorryInvoice,
  LorryLocationReport,
  LorryMaintenanceRecord,
  LorryNextService,
  InvoiceStatus,
} from '../types/lorryRecords';

/**
 * DEMO DATA ONLY. Every record carries `lorryId` so each profile tab can filter
 * by the selected lorry. GJ 18 GH 5566 (LR-007) intentionally has no records and
 * TS 09 AB 1234 (LR-004) has no maintenance history, to exercise empty states.
 */

interface Seed {
  lorryId: string;
  prefix: string;
  from: string;
  to: string;
  client: string;
  station: string;
  rate: number;
  odometer: number;
  baseAmount: number;
  litresBase: number;
  kmBase: number;
  workshop: string;
  statuses: InvoiceStatus[];
  noMaintenance?: boolean;
}

const SEEDS: Seed[] = [
  { lorryId: 'LR-001', prefix: 'MH12', from: 'Mumbai', to: 'Bengaluru', client: 'Reliance Retail Ltd', station: 'IndianOil COCO, Shirwal NH-48', rate: 91.5, odometer: 142850, baseAmount: 96000, litresBase: 310, kmBase: 1210, workshop: 'Tata Authorised Service, Pune', statuses: ['Paid', 'Pending', 'Pending'] },
  { lorryId: 'LR-002', prefix: 'NL01', from: 'Surat', to: 'Mumbai', client: 'Hindustan Unilever Ltd', station: 'HPCL Auto Care, Vapi NH-48', rate: 92.2, odometer: 98410, baseAmount: 41000, litresBase: 270, kmBase: 1020, workshop: 'Ashok Leyland Service, Surat', statuses: ['Paid', 'Paid', 'Pending'] },
  { lorryId: 'LR-003', prefix: 'KA04', from: 'Bengaluru', to: 'Chennai', client: 'Ashok Leyland, Hosur', station: 'BPCL Fuel Oasis, Hosur NH-44', rate: 90.8, odometer: 65420, baseAmount: 68000, litresBase: 340, kmBase: 1090, workshop: 'BharatBenz Workshop, Peenya', statuses: ['Paid', 'Overdue', 'Pending'] },
  { lorryId: 'LR-004', prefix: 'TS09', from: 'Hyderabad', to: 'Vijayawada', client: 'Avenue Supermarts (DMart)', station: 'IndianOil, Medchal ORR', rate: 91.1, odometer: 82300, baseAmount: 27000, litresBase: 180, kmBase: 690, workshop: '', statuses: ['Paid', 'Paid', 'Pending'], noMaintenance: true },
  { lorryId: 'LR-005', prefix: 'AP39', from: 'Vijayawada', to: 'Chennai Port', client: 'Chennai Port Trust', station: 'Reliance bp, Nellore NH-16', rate: 91.0, odometer: 124500, baseAmount: 58000, litresBase: 300, kmBase: 1150, workshop: 'Tata Authorised Service, Vijayawada', statuses: ['Paid', 'Pending', 'Overdue'] },
  { lorryId: 'LR-006', prefix: 'TN22', from: 'Chennai', to: 'Coimbatore', client: 'Amazon Transport Services', station: 'HPCL, Sriperumbudur', rate: 90.4, odometer: 76400, baseAmount: 24000, litresBase: 120, kmBase: 560, workshop: 'Mahindra Truck Service, Chennai', statuses: ['Paid', 'Paid', 'Paid'] },
];

const d = (iso: string) => `${iso}T09:00:00.000Z`;
const round2 = (n: number) => Math.round(n * 100) / 100;

export const MOCK_INVOICES: LorryInvoice[] = SEEDS.flatMap((s) =>
  ['2026-11-02', '2026-11-12', '2026-11-20'].map((date, i) => {
    const amount = s.baseAmount + i * 3500;
    const due = new Date(date);
    due.setDate(due.getDate() + 15);
    return {
      id: `${s.lorryId}-INV-${i + 1}`,
      lorryId: s.lorryId,
      invoiceNo: `FOS/26-27/${s.prefix}/${String(101 + i)}`,
      date: d(date),
      dueDate: d(due.toISOString().slice(0, 10)),
      client: s.client,
      tripRef: `TRP-${s.from.slice(0, 3).toUpperCase()}-${s.to.slice(0, 3).toUpperCase()}-${810 + i}`,
      amount,
      status: s.statuses[i],
    };
  })
);

export const MOCK_DIESEL: LorryDieselRecord[] = SEEDS.flatMap((s) =>
  ['2026-11-04', '2026-11-11', '2026-11-18', '2026-11-25'].map((date, i) => {
    const litres = s.litresBase + (i % 2) * 14 - i * 3;
    const distanceKm = s.kmBase + (i % 3) * 35;
    const rate = round2(s.rate + i * 0.2);
    return {
      id: `${s.lorryId}-DSL-${i + 1}`,
      lorryId: s.lorryId,
      date: d(date),
      station: s.station,
      litres,
      ratePerLitre: rate,
      amount: round2(litres * rate),
      odometerKm: s.odometer - (3 - i) * distanceKm,
      distanceKm,
      fullTank: i !== 2,
    };
  })
);

export const MOCK_MAINTENANCE: LorryMaintenanceRecord[] = SEEDS.filter((s) => !s.noMaintenance).flatMap((s) => [
  { id: `${s.lorryId}-MNT-1`, lorryId: s.lorryId, date: d('2026-08-18'), type: 'Service' as const, description: 'Periodic service: engine oil, oil & fuel filters, grease points', workshop: s.workshop, cost: 14800, odometerKm: s.odometer - 11200 },
  { id: `${s.lorryId}-MNT-2`, lorryId: s.lorryId, date: d('2026-10-05'), type: 'Tyres' as const, description: 'Tyre rotation and replacement of 2 rear tyres', workshop: s.workshop, cost: 38500, odometerKm: s.odometer - 5400 },
  { id: `${s.lorryId}-MNT-3`, lorryId: s.lorryId, date: d('2026-11-08'), type: 'Repair' as const, description: 'Brake liner replacement and air-dryer check', workshop: s.workshop, cost: 9200, odometerKm: s.odometer - 2100 },
]);

export const MOCK_NEXT_SERVICE: LorryNextService[] = SEEDS.filter((s) => !s.noMaintenance).map((s) => ({
  lorryId: s.lorryId,
  dueDate: d('2027-01-15'),
  dueOdometerKm: s.odometer + 8000,
  description: 'Periodic service and fitness inspection',
}));

export const MOCK_EXPENSES: LorryExpense[] = SEEDS.flatMap((s) => [
  { id: `${s.lorryId}-EXP-1`, lorryId: s.lorryId, date: d('2026-11-05'), category: 'Toll' as const, amount: 4860, tripRef: `TRP-${s.from.slice(0, 3).toUpperCase()}-${s.to.slice(0, 3).toUpperCase()}-810`, note: `FASTag tolls, ${s.from} to ${s.to}` },
  { id: `${s.lorryId}-EXP-2`, lorryId: s.lorryId, date: d('2026-11-05'), category: 'Driver Allowance' as const, amount: 3500, tripRef: `TRP-${s.from.slice(0, 3).toUpperCase()}-${s.to.slice(0, 3).toUpperCase()}-810`, note: 'Driver bata for trip' },
  { id: `${s.lorryId}-EXP-3`, lorryId: s.lorryId, date: d('2026-11-13'), category: 'Parking' as const, amount: 600, note: 'Night parking at transport yard' },
  { id: `${s.lorryId}-EXP-4`, lorryId: s.lorryId, date: d('2026-11-21'), category: 'Loading / Unloading' as const, amount: 2200, tripRef: `TRP-${s.from.slice(0, 3).toUpperCase()}-${s.to.slice(0, 3).toUpperCase()}-812`, note: 'Hamali charges at destination' },
]).filter((e) => e.lorryId !== 'LR-006' || e.category !== 'Parking');

/** Last reported positions: manual / driver check-ins. NOT live GPS. */
export const MOCK_LOCATION_REPORTS: LorryLocationReport[] = [
  { lorryId: 'LR-001', place: 'Kolhapur Bypass, NH-48, Maharashtra', lat: 16.705, lng: 74.2433, reportedAt: '2026-11-26T14:15:00.000Z', source: 'Driver check-in (phone call)', route: { from: 'Mumbai', to: 'Bengaluru', tripRef: 'TRP-BOM-BLR-892', eta: '2026-11-27T20:00:00.000Z' } },
  { lorryId: 'LR-002', place: 'Vapi Bypass, NH-48, Gujarat', lat: 20.3893, lng: 72.9106, reportedAt: '2026-11-25T21:40:00.000Z', source: 'Fuel entry location' },
  { lorryId: 'LR-003', place: 'BharatBenz Workshop, Peenya, Bengaluru', lat: 13.0285, lng: 77.5197, reportedAt: '2026-11-25T11:10:00.000Z', source: 'Workshop check-in' },
  { lorryId: 'LR-004', place: 'Logistics Hub, Medchal, Hyderabad', lat: 17.63, lng: 78.4817, reportedAt: '2026-11-24T18:05:00.000Z', source: 'Yard manager update' },
  { lorryId: 'LR-005', place: 'NH-16 near Nellore, Andhra Pradesh', lat: 14.4426, lng: 79.9865, reportedAt: '2026-11-26T10:30:00.000Z', source: 'Driver check-in (phone call)', route: { from: 'Vijayawada', to: 'Chennai Port', tripRef: 'TRP-VJA-MAA-455', eta: '2026-11-27T06:00:00.000Z' } },
  { lorryId: 'LR-006', place: 'Sriperumbudur, Tamil Nadu', lat: 12.9675, lng: 79.9419, reportedAt: '2026-11-22T16:20:00.000Z', source: 'Fuel entry location' },
  // LR-007: no report on purpose (empty state)
];
