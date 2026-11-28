import {
  FuelReceiptRecord,
  ReceiptPaymentMethod,
  ReceiptPaymentStatus,
} from '../types/fuelReceipt';

type Listener = () => void;

const normalizeReceiptNo = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');
const round2 = (n: number) => Math.round(n * 100) / 100;

interface SeedReceiptInput {
  id: string;
  lorryId: string;
  lorryRegistration: string;
  tripId?: string;
  fuelStation: string;
  stationLocation: string;
  receiptNumber: string;
  receiptDate: string;
  receiptTime: string;
  dieselLitres: number;
  pricePerLitre: number;
  paymentStatus: ReceiptPaymentStatus;
  paymentDate?: string;
  paymentMethod?: ReceiptPaymentMethod;
  gstDetails?: string;
}

const makeSeed = (s: SeedReceiptInput): FuelReceiptRecord => ({
  ...s,
  totalAmount: round2(s.dieselLitres * s.pricePerLitre),
  ocrExtracted: false,
  isDemoSeed: true,
  createdAt: `${s.receiptDate}T${s.receiptTime}:00.000Z`,
});

/**
 * Connected DEMO fuel receipts linked to real TripService trip IDs and lorry IDs.
 * - Includes multiple purchases per trip, PAID & UNPAID receipts,
 *   unassigned receipts (tripId: undefined), and an out-of-timeline receipt
 *   on LR-001 (IOC-88205 on 2026-11-20 linked to TRP-2026-098 ending 2026-11-19)
 *   to exercise manual-review flagging.
 * - LR-007 (GJ 18 GH 5566) intentionally has 0 receipts for empty states.
 */
const INITIAL_DEMO_RECEIPTS: FuelReceiptRecord[] = [
  // LR-001 — TRP-2026-101 (Mumbai → Bengaluru, 2026-11-23 to 2026-11-26) — 3 purchases
  makeSeed({
    id: 'RCP-DEMO-1001',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-101',
    fuelStation: 'IndianOil COCO Express',
    stationLocation: 'Khalapur, Mumbai-Pune Expwy, MH',
    receiptNumber: 'IOC-88291',
    receiptDate: '2026-11-23',
    receiptTime: '08:45',
    dieselLitres: 220,
    pricePerLitre: 91.5,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-23',
    paymentMethod: 'Card',
    gstDetails: 'GSTIN: 27AAACI1681G1Z5',
  }),
  makeSeed({
    id: 'RCP-DEMO-1002',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-101',
    fuelStation: 'BPCL Highway Oasis',
    stationLocation: 'Kolhapur Bypass, NH-48, MH',
    receiptNumber: 'BP-40112',
    receiptDate: '2026-11-24',
    receiptTime: '19:20',
    dieselLitres: 185.5,
    pricePerLitre: 91.8,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-25',
    paymentMethod: 'UPI',
  }),
  makeSeed({
    id: 'RCP-DEMO-1003',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-101',
    fuelStation: 'HPCL Truck Stop',
    stationLocation: 'Tumakuru NH-48, Karnataka',
    receiptNumber: 'HP-55190',
    receiptDate: '2026-11-25',
    receiptTime: '14:10',
    dieselLitres: 160,
    pricePerLitre: 90.9,
    paymentStatus: 'UNPAID',
  }),

  // LR-001 — TRP-2026-098 (Pune → Hyderabad, 2026-11-16 to 2026-11-19) — 2 purchases (one flagged outside timeline!)
  makeSeed({
    id: 'RCP-DEMO-1004',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-098',
    fuelStation: 'IndianOil Swagat Pump',
    stationLocation: 'Solapur Highway, NH-65, MH',
    receiptNumber: 'IOC-88201',
    receiptDate: '2026-11-17',
    receiptTime: '11:30',
    dieselLitres: 240,
    pricePerLitre: 91.4,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-17',
    paymentMethod: 'Card',
  }),
  makeSeed({
    id: 'RCP-DEMO-1005',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-098',
    fuelStation: 'Reliance Jio-bp Outlet',
    stationLocation: 'Patancheru, Hyderabad, TS',
    receiptNumber: 'JBP-88205',
    receiptDate: '2026-11-20', // Outside 2026-11-16..19 -> flagged for manual review!
    receiptTime: '07:15',
    dieselLitres: 110,
    pricePerLitre: 91.2,
    paymentStatus: 'UNPAID',
  }),

  // LR-001 — TRP-2026-092 (Mumbai → Ahmedabad, 2026-11-04 to 2026-11-06)
  makeSeed({
    id: 'RCP-DEMO-1006',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-092',
    fuelStation: 'HPCL Auto Care',
    stationLocation: 'Vapi Bypass, NH-48, Gujarat',
    receiptNumber: 'HP-33104',
    receiptDate: '2026-11-05',
    receiptTime: '16:05',
    dieselLitres: 210,
    pricePerLitre: 91.6,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-05',
    paymentMethod: 'Bank Transfer',
  }),

  // LR-001 — Unassigned Fuel Purchase (tripId intentionally undefined!)
  makeSeed({
    id: 'RCP-DEMO-1007',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: undefined,
    fuelStation: 'IndianOil Yard Pump',
    stationLocation: 'Nigdi Transport Nagar, Pune, MH',
    receiptNumber: 'IOC-YD-7741',
    receiptDate: '2026-11-22',
    receiptTime: '18:30',
    dieselLitres: 75,
    pricePerLitre: 91.5,
    paymentStatus: 'UNPAID',
  }),

  // LR-001 — Earlier 2026 & 2025 trips (for Monthly/Yearly reports)
  makeSeed({
    id: 'RCP-DEMO-1008',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-081',
    fuelStation: 'BPCL Ghar',
    stationLocation: 'Hubballi Bypass, NH-48, KA',
    receiptNumber: 'BP-77210',
    receiptDate: '2026-10-15',
    receiptTime: '13:40',
    dieselLitres: 295,
    pricePerLitre: 91.1,
    paymentStatus: 'PAID',
    paymentDate: '2026-10-16',
    paymentMethod: 'Card',
  }),
  makeSeed({
    id: 'RCP-DEMO-1009',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2026-064',
    fuelStation: 'IndianOil COCO',
    stationLocation: 'Krishnagiri NH-44, TN',
    receiptNumber: 'IOC-66120',
    receiptDate: '2026-08-12',
    receiptTime: '10:15',
    dieselLitres: 310,
    pricePerLitre: 90.8,
    paymentStatus: 'PAID',
    paymentDate: '2026-08-12',
    paymentMethod: 'Card',
  }),
  makeSeed({
    id: 'RCP-DEMO-1010',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2025-412',
    fuelStation: 'HPCL Highway King',
    stationLocation: 'Udaipur Bypass, NH-48, RJ',
    receiptNumber: 'HP-25412',
    receiptDate: '2025-11-14',
    receiptTime: '15:50',
    dieselLitres: 340,
    pricePerLitre: 90.2,
    paymentStatus: 'PAID',
    paymentDate: '2025-11-15',
    paymentMethod: 'Bank Transfer',
  }),
  makeSeed({
    id: 'RCP-DEMO-1011',
    lorryId: 'LR-001',
    lorryRegistration: 'MH 12 RN 4821',
    tripId: 'TRP-2025-318',
    fuelStation: 'IndianOil COCO',
    stationLocation: 'Belagavi NH-48, KA',
    receiptNumber: 'IOC-25318',
    receiptDate: '2025-07-09',
    receiptTime: '09:20',
    dieselLitres: 260,
    pricePerLitre: 89.9,
    paymentStatus: 'PAID',
    paymentDate: '2025-07-10',
    paymentMethod: 'UPI',
  }),

  // LR-002 (NL 01 AA 6512)
  makeSeed({
    id: 'RCP-DEMO-2001',
    lorryId: 'LR-002',
    lorryRegistration: 'NL 01 AA 6512',
    tripId: 'TRP-2026-204',
    fuelStation: 'HPCL Auto Care',
    stationLocation: 'Vapi Bypass, NH-48, Gujarat',
    receiptNumber: 'HP-33419',
    receiptDate: '2026-11-24',
    receiptTime: '21:40',
    dieselLitres: 180,
    pricePerLitre: 92.2,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-24',
    paymentMethod: 'Card',
  }),
  makeSeed({
    id: 'RCP-DEMO-2002',
    lorryId: 'LR-002',
    lorryRegistration: 'NL 01 AA 6512',
    tripId: 'TRP-2026-204',
    fuelStation: 'IndianOil Vasai',
    stationLocation: 'Vasai NH-48, Maharashtra',
    receiptNumber: 'IOC-33425',
    receiptDate: '2026-11-25',
    receiptTime: '12:15',
    dieselLitres: 95,
    pricePerLitre: 92.1,
    paymentStatus: 'UNPAID',
  }),
  makeSeed({
    id: 'RCP-DEMO-2003',
    lorryId: 'LR-002',
    lorryRegistration: 'NL 01 AA 6512',
    tripId: 'TRP-2026-197',
    fuelStation: 'Reliance Jio-bp',
    stationLocation: 'Ankleshwar NH-48, Gujarat',
    receiptNumber: 'JBP-19701',
    receiptDate: '2026-11-12',
    receiptTime: '14:00',
    dieselLitres: 230,
    pricePerLitre: 91.5,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-13',
    paymentMethod: 'UPI',
  }),
  makeSeed({
    id: 'RCP-DEMO-2004',
    lorryId: 'LR-002',
    lorryRegistration: 'NL 01 AA 6512',
    tripId: undefined,
    fuelStation: 'HPCL Surat Yard',
    stationLocation: 'Palsana, Surat, Gujarat',
    receiptNumber: 'HP-YD-2091',
    receiptDate: '2026-11-21',
    receiptTime: '09:05',
    dieselLitres: 60,
    pricePerLitre: 92.0,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-21',
    paymentMethod: 'Cash',
  }),
  makeSeed({
    id: 'RCP-DEMO-2005',
    lorryId: 'LR-002',
    lorryRegistration: 'NL 01 AA 6512',
    tripId: 'TRP-2025-510',
    fuelStation: 'BPCL Express',
    stationLocation: 'Dhule NH-53, Maharashtra',
    receiptNumber: 'BP-25510',
    receiptDate: '2025-09-19',
    receiptTime: '17:30',
    dieselLitres: 250,
    pricePerLitre: 90.4,
    paymentStatus: 'PAID',
    paymentDate: '2025-09-20',
    paymentMethod: 'Card',
  }),

  // LR-003 (KA 04 D 7712)
  makeSeed({
    id: 'RCP-DEMO-3001',
    lorryId: 'LR-003',
    lorryRegistration: 'KA 04 D 7712',
    tripId: 'TRP-2026-305',
    fuelStation: 'BPCL Fuel Oasis',
    stationLocation: 'Hosur Road NH-44, TN',
    receiptNumber: 'BP-99412',
    receiptDate: '2026-11-24',
    receiptTime: '11:10',
    dieselLitres: 190,
    pricePerLitre: 90.8,
    paymentStatus: 'UNPAID',
  }),
  makeSeed({
    id: 'RCP-DEMO-3002',
    lorryId: 'LR-003',
    lorryRegistration: 'KA 04 D 7712',
    tripId: 'TRP-2026-288',
    fuelStation: 'IndianOil Salem',
    stationLocation: 'Salem Bypass NH-544, TN',
    receiptNumber: 'IOC-28801',
    receiptDate: '2026-11-09',
    receiptTime: '15:25',
    dieselLitres: 215,
    pricePerLitre: 90.9,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-10',
    paymentMethod: 'UPI',
  }),

  // LR-004 (TS 09 AB 1234)
  makeSeed({
    id: 'RCP-DEMO-4001',
    lorryId: 'LR-004',
    lorryRegistration: 'TS 09 AB 1234',
    tripId: 'TRP-2026-402',
    fuelStation: 'IndianOil Medchal',
    stationLocation: 'Medchal ORR, Hyderabad, TS',
    receiptNumber: 'IOC-40211',
    receiptDate: '2026-11-24',
    receiptTime: '10:00',
    dieselLitres: 140,
    pricePerLitre: 91.1,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-24',
    paymentMethod: 'UPI',
  }),

  // LR-005 (AP 39 CD 9087)
  makeSeed({
    id: 'RCP-DEMO-5001',
    lorryId: 'LR-005',
    lorryRegistration: 'AP 39 CD 9087',
    tripId: 'TRP-2026-501',
    fuelStation: 'Reliance Jio-bp',
    stationLocation: 'Nellore NH-16, Andhra Pradesh',
    receiptNumber: 'JBP-50112',
    receiptDate: '2026-11-24',
    receiptTime: '13:15',
    dieselLitres: 260,
    pricePerLitre: 91.0,
    paymentStatus: 'UNPAID',
  }),

  // LR-006 (TN 22 EF 3344)
  makeSeed({
    id: 'RCP-DEMO-6001',
    lorryId: 'LR-006',
    lorryRegistration: 'TN 22 EF 3344',
    tripId: 'TRP-2026-601',
    fuelStation: 'HPCL Sriperumbudur',
    stationLocation: 'Sriperumbudur NH-48, TN',
    receiptNumber: 'HP-60110',
    receiptDate: '2026-11-25',
    receiptTime: '08:30',
    dieselLitres: 115,
    pricePerLitre: 90.4,
    paymentStatus: 'PAID',
    paymentDate: '2026-11-25',
    paymentMethod: 'Card',
  }),
];

/**
 * Single source of truth for confirmed Fuel Receipts across:
 * - Fuel Receipts screen
 * - Smart Fuel Receipt Scanner
 * - Purchased Diesel Reports & Analytics
 *
 * Strictly isolated by `lorryId`, prevents duplicates, and never mixes with Fuel Calculator estimates.
 */
class FuelReceiptServiceClass {
  private receipts: FuelReceiptRecord[] = [...INITIAL_DEMO_RECEIPTS];
  private listeners: Set<Listener> = new Set();
  private nextSeq = 1;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getByLorryId(lorryId: string): FuelReceiptRecord[] {
    return this.receipts
      .filter((r) => r.lorryId === lorryId)
      .sort(
        (a, b) =>
          b.receiptDate.localeCompare(a.receiptDate) ||
          (b.receiptTime ?? '').localeCompare(a.receiptTime ?? '') ||
          b.createdAt.localeCompare(a.createdAt)
      );
  }

  isDuplicate(lorryId: string, receiptNumber: string, receiptDate: string): boolean {
    const cleanNo = normalizeReceiptNo(receiptNumber);
    if (!cleanNo) return false;
    return this.receipts.some(
      (r) =>
        r.lorryId === lorryId &&
        normalizeReceiptNo(r.receiptNumber) === cleanNo &&
        r.receiptDate === receiptDate
    );
  }

  addReceipt(
    data: Omit<FuelReceiptRecord, 'id' | 'createdAt' | 'isDemoSeed'>
  ): FuelReceiptRecord {
    const cleanNo = normalizeReceiptNo(data.receiptNumber);
    if (!data.fuelStation.trim()) throw new Error('Fuel station name is required.');
    if (!cleanNo) throw new Error('Receipt / invoice number is required.');
    if (!data.receiptDate) throw new Error('Receipt date is required.');
    if (!Number.isFinite(data.dieselLitres) || data.dieselLitres <= 0) {
      throw new Error('Diesel quantity in litres must be greater than zero.');
    }
    if (!Number.isFinite(data.pricePerLitre) || data.pricePerLitre <= 0) {
      throw new Error('Diesel price per litre must be greater than zero.');
    }
    if (!Number.isFinite(data.totalAmount) || data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than zero.');
    }
    if (data.paymentStatus === 'PAID' && (!data.paymentDate || !data.paymentMethod)) {
      throw new Error('Payment date and payment method are required when status is PAID.');
    }
    if (this.isDuplicate(data.lorryId, cleanNo, data.receiptDate)) {
      throw new Error(
        `Duplicate receipt detected: "${cleanNo}" on ${data.receiptDate} already exists for ${data.lorryRegistration}.`
      );
    }

    const record: FuelReceiptRecord = {
      ...data,
      id: `RCP-2026-${String(this.nextSeq++).padStart(4, '0')}`,
      receiptNumber: cleanNo,
      fuelStation: data.fuelStation.trim(),
      stationLocation: data.stationLocation?.trim() || undefined,
      tripId: data.tripId || undefined,
      paymentDate: data.paymentStatus === 'PAID' ? data.paymentDate : undefined,
      paymentMethod: data.paymentStatus === 'PAID' ? data.paymentMethod : undefined,
      isDemoSeed: false,
      createdAt: new Date().toISOString(),
    };

    this.receipts.unshift(record);
    this.notify();
    return record;
  }

  markAsPaid(
    receiptId: string,
    paymentDate: string,
    paymentMethod: ReceiptPaymentMethod
  ): FuelReceiptRecord {
    if (!paymentDate) throw new Error('Payment date is required.');
    if (!paymentMethod) throw new Error('Payment method is required.');

    const idx = this.receipts.findIndex((r) => r.id === receiptId);
    if (idx === -1) throw new Error('Receipt not found.');

    const updated: FuelReceiptRecord = {
      ...this.receipts[idx],
      paymentStatus: 'PAID' as ReceiptPaymentStatus,
      paymentDate,
      paymentMethod,
    };

    this.receipts[idx] = updated;
    this.notify();
    return updated;
  }

  updateReceipt(
    receiptId: string,
    updates: {
      fuelStation: string;
      receiptNumber: string;
      receiptDate: string;
      dieselLitres: number;
      pricePerLitre: number;
      totalAmount: number;
    }
  ): FuelReceiptRecord {
    const idx = this.receipts.findIndex((r) => r.id === receiptId);
    if (idx === -1) throw new Error('Receipt not found.');

    const existing = this.receipts[idx];
    const cleanNo = normalizeReceiptNo(updates.receiptNumber);
    if (!updates.fuelStation.trim()) throw new Error('Fuel station name is required.');
    if (!cleanNo) throw new Error('Receipt / invoice number is required.');
    if (!updates.receiptDate) throw new Error('Receipt date is required.');
    if (!Number.isFinite(updates.dieselLitres) || updates.dieselLitres <= 0) {
      throw new Error('Diesel litres must be greater than zero.');
    }
    if (!Number.isFinite(updates.pricePerLitre) || updates.pricePerLitre <= 0) {
      throw new Error('Price per litre must be greater than zero.');
    }
    if (!Number.isFinite(updates.totalAmount) || updates.totalAmount <= 0) {
      throw new Error('Total amount must be greater than zero.');
    }

    const dup = this.receipts.some(
      (r) =>
        r.id !== receiptId &&
        r.lorryId === existing.lorryId &&
        normalizeReceiptNo(r.receiptNumber) === cleanNo &&
        r.receiptDate === updates.receiptDate
    );
    if (dup) {
      throw new Error(
        `Duplicate receipt detected: "${cleanNo}" on ${updates.receiptDate} already exists.`
      );
    }

    const updated: FuelReceiptRecord = {
      ...existing,
      fuelStation: updates.fuelStation.trim(),
      receiptNumber: cleanNo,
      receiptDate: updates.receiptDate,
      dieselLitres: round2(updates.dieselLitres),
      pricePerLitre: round2(updates.pricePerLitre),
      totalAmount: round2(updates.totalAmount),
    };

    this.receipts[idx] = updated;
    this.notify();
    return updated;
  }
}

export const FuelReceiptService = new FuelReceiptServiceClass();
