import {
  FuelReceiptRecord,
  ReceiptPaymentMethod,
  ReceiptPaymentStatus,
} from '../types/fuelReceipt';
import { FUEL_LEDGER } from './mockFuelLedger';
import { LorryService } from './lorryService';

type Listener = () => void;

const normalizeReceiptNo = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');

const mapPaymentMethod = (mode: string): ReceiptPaymentMethod => {
  if (mode === 'UPI') return 'UPI';
  if (mode === 'Cash') return 'Cash';
  if (mode === 'Fleet Card' || mode === 'FASTag Wallet') return 'Card';
  return 'Other';
};

function seedDemoReceipts(): FuelReceiptRecord[] {
  const regMap = new Map(LorryService.getAllLorries().map((l) => [l.id, l.registrationNumber]));
  // Take up to the 6 most recent fills per lorry from FUEL_LEDGER as demo confirmed receipts
  const countByLorry = new Map<string, number>();
  const seeded: FuelReceiptRecord[] = [];

  for (const entry of FUEL_LEDGER) {
    const count = countByLorry.get(entry.lorryId) ?? 0;
    if (count >= 6) continue;
    countByLorry.set(entry.lorryId, count + 1);

    // Make the most recent entry UNPAID on demo seeds so the owner can test Mark as PAID immediately
    const isUnpaid = count === 0;
    const receiptDate = entry.date.slice(0, 10);

    seeded.push({
      id: `RCP-DEMO-${entry.id}`,
      lorryId: entry.lorryId,
      lorryRegistration: regMap.get(entry.lorryId) ?? entry.lorryId,
      fuelStation: entry.station,
      receiptNumber: entry.receiptNo,
      receiptDate,
      receiptTime: '09:00',
      dieselLitres: entry.litres,
      pricePerLitre: entry.ratePerLitre,
      totalAmount: entry.amount,
      paymentStatus: isUnpaid ? 'UNPAID' : 'PAID',
      paymentDate: isUnpaid ? undefined : receiptDate,
      paymentMethod: isUnpaid ? undefined : mapPaymentMethod(entry.paymentMode),
      ocrExtracted: false,
      isDemoSeed: true,
      createdAt: entry.date,
    });
  }

  return seeded.sort((a, b) => b.receiptDate.localeCompare(a.receiptDate));
}

/**
 * In-memory demo store for confirmed Fuel Receipts.
 * - Strictly isolated by `lorryId`.
 * - Enforces duplicate prevention by `(lorryId, normalizedReceiptNumber, receiptDate)`.
 * - Kept strictly separate from Fuel Calculator estimates (`FuelEstimateService`).
 */
class FuelReceiptServiceClass {
  private receipts: FuelReceiptRecord[] = seedDemoReceipts();
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
      .sort((a, b) => b.receiptDate.localeCompare(a.receiptDate) || b.createdAt.localeCompare(a.createdAt));
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
}

export const FuelReceiptService = new FuelReceiptServiceClass();
