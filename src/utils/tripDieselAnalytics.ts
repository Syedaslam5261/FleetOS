import {
  TripChartPoint,
  TripDieselRecord,
  TripDieselSummary,
  TripPeriodMode,
} from '../types/tripDiesel';

const MS_DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

const parseDayUtc = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const msToDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Monday–Sunday boundaries for any YYYY-MM-DD date. */
export function getWeekBounds(anchorDate: string): { start: string; end: string; days: string[] } {
  const ms = parseDayUtc(anchorDate);
  const dow = (new Date(ms).getUTCDay() + 6) % 7; // Monday = 0
  const mon = ms - dow * MS_DAY;
  const days = Array.from({ length: 7 }, (_, i) => msToDay(mon + i * MS_DAY));
  return { start: days[0], end: days[6], days };
}

export function shiftDateByDays(dateStr: string, deltaDays: number): string {
  return msToDay(parseDayUtc(dateStr) + deltaDays * MS_DAY);
}

/**
 * Filter trips strictly by lorryId and the selected period (Daily, Weekly, Monthly, Yearly).
 * All four views compute from the exact same underlying trip records.
 */
export function filterTripsByPeriod(
  allRecords: TripDieselRecord[],
  lorryId: string,
  mode: TripPeriodMode,
  selection: {
    day: string; // YYYY-MM-DD
    weekAnchor: string; // YYYY-MM-DD (any day inside the week)
    month: string; // YYYY-MM
    year: string; // YYYY
  }
): TripDieselRecord[] {
  const lorryTrips = allRecords.filter((r) => r.lorryId === lorryId);

  if (mode === 'daily') {
    return lorryTrips.filter((r) => r.tripDate === selection.day);
  }
  if (mode === 'weekly') {
    const { start, end } = getWeekBounds(selection.weekAnchor);
    return lorryTrips.filter((r) => r.tripDate >= start && r.tripDate <= end);
  }
  if (mode === 'monthly') {
    return lorryTrips.filter((r) => r.tripDate.startsWith(selection.month));
  }
  return lorryTrips.filter((r) => r.tripDate.startsWith(selection.year));
}

/**
 * Exact summary calculation rules:
 * - Total Trips = count of trips in period
 * - Total Distance = sum of trip distances
 * - Total Diesel Consumed = sum of recorded diesel litres
 * - Total Diesel Expense = sum of recorded trip diesel costs
 */
export function summarizeTripDiesel(records: TripDieselRecord[]): TripDieselSummary {
  let totalDistanceKm = 0;
  let totalDieselLitres = 0;
  let totalDieselExpense = 0;

  for (const r of records) {
    totalDistanceKm += r.distanceKm;
    totalDieselLitres += r.dieselLitres;
    totalDieselExpense += r.totalDieselCost;
  }

  return {
    totalTrips: records.length,
    totalDistanceKm: round2(totalDistanceKm),
    totalDieselLitres: round2(totalDieselLitres),
    totalDieselExpense: round2(totalDieselExpense),
  };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Build period-appropriate chart buckets strictly from the filtered trip records. */
export function buildTripChartData(
  filteredRecords: TripDieselRecord[],
  mode: TripPeriodMode,
  selection: {
    day: string;
    weekAnchor: string;
    month: string;
    year: string;
  }
): TripChartPoint[] {
  if (mode === 'daily') {
    // Trip-wise bars for the selected day
    return [...filteredRecords]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((r) => ({
        key: r.id,
        label: `${r.startLocation.slice(0, 6)}→${r.destination.slice(0, 6)}`,
        expense: r.totalDieselCost,
        litres: r.dieselLitres,
        trips: 1,
      }));
  }

  if (mode === 'weekly') {
    // Daily bars Mon–Sun across the selected week
    const { days } = getWeekBounds(selection.weekAnchor);
    return days.map((dayStr, i) => {
      const rows = filteredRecords.filter((r) => r.tripDate === dayStr);
      const s = summarizeTripDiesel(rows);
      return {
        key: dayStr,
        label: `${DAY_NAMES[i]} ${dayStr.slice(8)}`,
        expense: s.totalDieselExpense,
        litres: s.totalDieselLitres,
        trips: s.totalTrips,
      };
    });
  }

  if (mode === 'monthly') {
    // Weekly trend buckets across the selected month (Week 1 to Week 5)
    const [yr, mo] = selection.month.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
    const ranges = [
      { label: 'Days 1–7', start: 1, end: 7 },
      { label: 'Days 8–14', start: 8, end: 14 },
      { label: 'Days 15–21', start: 15, end: 21 },
      { label: 'Days 22–28', start: 22, end: 28 },
      ...(daysInMonth > 28 ? [{ label: `Days 29–${daysInMonth}`, start: 29, end: daysInMonth }] : []),
    ];

    return ranges.map((bucket) => {
      const rows = filteredRecords.filter((r) => {
        const d = Number(r.tripDate.slice(8, 10));
        return d >= bucket.start && d <= bucket.end;
      });
      const s = summarizeTripDiesel(rows);
      return {
        key: bucket.label,
        label: bucket.label,
        expense: s.totalDieselExpense,
        litres: s.totalDieselLitres,
        trips: s.totalTrips,
      };
    });
  }

  // Yearly: Monthly trend Jan–Dec
  return MONTH_NAMES.map((name, idx) => {
    const mm = String(idx + 1).padStart(2, '0');
    const prefix = `${selection.year}-${mm}`;
    const rows = filteredRecords.filter((r) => r.tripDate.startsWith(prefix));
    const s = summarizeTripDiesel(rows);
    return {
      key: prefix,
      label: name,
      expense: s.totalDieselExpense,
      litres: s.totalDieselLitres,
      trips: s.totalTrips,
    };
  });
}
