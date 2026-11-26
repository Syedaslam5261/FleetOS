import { FuelLedgerEntry, FuelPaymentMode, VerificationStatus } from '../types/fuel';
import { MOCK_DIESEL } from './mockLorryRecords';

/**
 * DEMO DATA ONLY. Fleet-wide diesel ledger, Jan 2025 to Nov 2026.
 *
 * - The four November 2026 fills per lorry are the SAME records the Individual Lorry
 *   Profile shows (MOCK_DIESEL, read-only), so both screens agree.
 * - Earlier history is generated deterministically backwards from each lorry's first
 *   November fill, keeping odometer readings consistent.
 * - Receipt numbers, payment modes and verification statuses are sample values.
 *   No receipt files exist and nothing here has been verified against a real source.
 * - Every entry carries a `lorryId`. LR-007 has no fuel records on purpose.
 */

const MS_DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;
const dayOf = (iso: string) => iso.slice(0, 10);
const toMs = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const msToDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFrom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stationPrefix = (station: string) =>
  /indianoil/i.test(station) ? 'IOC' : /hpcl/i.test(station) ? 'HP' : /bpcl/i.test(station) ? 'BP' : 'JBP';

const FLAG_REASONS = [
  'Rate differs from station board price',
  'Receipt copy not attached',
  'Odometer gap exceeds usual tank range',
];

type Base = Omit<FuelLedgerEntry, 'receiptNo' | 'paymentMode' | 'verification' | 'flagReason'>;

function build(): FuelLedgerEntry[] {
  const byLorry = new Map<string, typeof MOCK_DIESEL>();
  for (const r of MOCK_DIESEL) byLorry.set(r.lorryId, [...(byLorry.get(r.lorryId) ?? []), r]);

  const bases: Base[] = [];
  const startMs = toMs('2025-01-03');

  for (const [lorryId, rows] of byLorry) {
    const asc = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    for (const r of asc) bases.push({ ...r });

    const first = asc[0];
    const firstMs = toMs(dayOf(first.date));
    const rng = rngFrom(hashStr(lorryId));
    let cursor = firstMs;
    let nextOdo = first.odometerKm - first.distanceKm;

    for (let k = 1; k <= 200; k++) {
      cursor -= (8 + Math.floor(rng() * 3)) * MS_DAY;
      if (cursor < startMs) break;
      const distanceKm = Math.round(first.distanceKm * (0.9 + rng() * 0.2));
      if (nextOdo - distanceKm < 500) break;
      const litres = Math.round(first.litres * (0.92 + rng() * 0.16));
      const frac = (cursor - startMs) / (firstMs - startMs);
      const rate = round2(89.4 + (first.ratePerLitre - 89.4) * frac + (rng() - 0.5) * 0.5);
      bases.push({
        id: `${lorryId}-FUEL-${String(k).padStart(3, '0')}`,
        lorryId,
        date: `${msToDay(cursor)}T09:00:00.000Z`,
        station: first.station,
        litres,
        ratePerLitre: rate,
        amount: round2(litres * rate),
        odometerKm: nextOdo,
        distanceKm,
        fullTank: rng() > 0.15,
      });
      nextOdo -= distanceKm;
    }
  }

  const refMs = Math.max(...bases.map((b) => toMs(dayOf(b.date))));

  return bases
    .map((b): FuelLedgerEntry => {
      const rng = rngFrom(hashStr(b.id));
      const ageDays = (refMs - toMs(dayOf(b.date))) / MS_DAY;
      const pm = rng();
      const paymentMode: FuelPaymentMode =
        pm < 0.6 ? 'Fleet Card' : pm < 0.7 ? 'FASTag Wallet' : pm < 0.9 ? 'UPI' : 'Cash';
      const v = rng();
      let verification: VerificationStatus;
      if (ageDays <= 14) verification = v < 0.45 ? 'Pending' : 'Verified';
      else verification = v < 0.94 ? 'Verified' : 'Flagged';
      const entry: FuelLedgerEntry = {
        ...b,
        receiptNo: `${stationPrefix(b.station)}-${String(10000 + (hashStr(b.id) % 89999))}`,
        paymentMode,
        verification,
      };
      if (verification === 'Flagged') {
        entry.flagReason =
          paymentMode === 'Cash' ? 'Cash payment, receipt copy not attached' : FLAG_REASONS[Math.floor(rng() * FLAG_REASONS.length)];
      }
      return entry;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const FUEL_LEDGER: FuelLedgerEntry[] = build();

/** Latest day with data. Presets such as "Last 30 days" are relative to this, not the real clock. */
export const FUEL_REFERENCE_DAY: string = dayOf(FUEL_LEDGER[0].date);
