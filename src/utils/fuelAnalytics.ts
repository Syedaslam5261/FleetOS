import { FuelLedgerEntry, FuelSummary, PeriodPoint } from '../types/fuel';

const MS_DAY = 86_400_000;
export const dayOf = (iso: string) => iso.slice(0, 10);
const toMs = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const msToDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Filter by lorry ID and an inclusive YYYY-MM-DD range ('' = unbounded). */
export function filterEntries(
  entries: FuelLedgerEntry[],
  lorryId: 'ALL' | string,
  from = '',
  to = ''
): FuelLedgerEntry[] {
  return entries.filter((e) => {
    if (lorryId !== 'ALL' && e.lorryId !== lorryId) return false;
    const day = dayOf(e.date);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });
}

export function summarize(entries: FuelLedgerEntry[]): FuelSummary {
  let litres = 0, spend = 0, distanceKm = 0, fullTankFills = 0, fullLitres = 0, fullDistance = 0;
  for (const e of entries) {
    litres += e.litres;
    spend += e.amount;
    distanceKm += e.distanceKm;
    if (e.fullTank) {
      fullTankFills++;
      fullLitres += e.litres;
      fullDistance += e.distanceKm;
    }
  }
  return {
    fills: entries.length,
    fullTankFills,
    partialFills: entries.length - fullTankFills,
    litres,
    spend,
    distanceKm,
    avgMileage: fullLitres > 0 ? fullDistance / fullLitres : null,
    costPerKm: distanceKm > 0 ? spend / distanceKm : null,
    avgRate: litres > 0 ? spend / litres : null,
  };
}

export function groupByLorry(entries: FuelLedgerEntry[]): Array<{ lorryId: string; summary: FuelSummary }> {
  const map = new Map<string, FuelLedgerEntry[]>();
  for (const e of entries) map.set(e.lorryId, [...(map.get(e.lorryId) ?? []), e]);
  return [...map.entries()]
    .map(([lorryId, rows]) => ({ lorryId, summary: summarize(rows) }))
    .sort((a, b) => b.summary.litres - a.summary.litres);
}

const point = (key: string, label: string, rows: FuelLedgerEntry[]): PeriodPoint => {
  const s = summarize(rows);
  return { ...s, key, label, mileage: s.avgMileage };
};

const weekStartMs = (day: string) => {
  const ms = toMs(day);
  const dow = (new Date(ms).getUTCDay() + 6) % 7; // Monday = 0
  return ms - dow * MS_DAY;
};

/** Last `weeks` Monday-based weeks ending at refDay, including empty weeks. */
export function bucketByWeek(entries: FuelLedgerEntry[], refDay: string, weeks = 12): PeriodPoint[] {
  const last = weekStartMs(refDay);
  const out: PeriodPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = last - i * 7 * MS_DAY;
    const rows = entries.filter((e) => weekStartMs(dayOf(e.date)) === start);
    const label = new Date(start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' });
    out.push(point(msToDay(start), label, rows));
  }
  return out;
}

/** Last `months` calendar months ending at refDay's month, including empty months. */
export function bucketByMonth(entries: FuelLedgerEntry[], refDay: string, months = 12): PeriodPoint[] {
  const [ry, rm] = refDay.split('-').map(Number);
  const out: PeriodPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(ry, rm - 1 - i, 1));
    const key = dt.toISOString().slice(0, 7);
    const rows = entries.filter((e) => e.date.slice(0, 7) === key);
    const label = dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    out.push(point(key, label, rows));
  }
  return out;
}

/** One point per calendar year present in `entries`, ascending. */
export function bucketByYear(entries: FuelLedgerEntry[]): PeriodPoint[] {
  const years = [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort();
  return years.map((y) => point(y, y, entries.filter((e) => e.date.startsWith(y))));
}

/** Estimated diesel for a planned run. Returns null unless all inputs are positive numbers. */
export function calcFuelEstimate(distanceKm: number, mileageKmPerL: number, pricePerL: number) {
  if (![distanceKm, mileageKmPerL, pricePerL].every((n) => Number.isFinite(n) && n > 0)) return null;
  const litres = distanceKm / mileageKmPerL;
  const cost = litres * pricePerL;
  return { litres, cost, costPerKm: cost / distanceKm };
}
