import React, { useMemo } from 'react';
import { ProfileEmptyState, TableShell } from '../fleet/profile/ProfileParts';
import { FuelTrendChart } from './FuelTrendChart';
import { FuelLedgerEntry } from '../../types/fuel';
import { bucketByMonth, bucketByWeek, bucketByYear, groupByLorry, summarize } from '../../utils/fuelAnalytics';
import { formatINR } from '../../utils/formatters';
import { formatDateOnly } from '../../utils/formatters';

interface Props {
  rangeEntries: FuelLedgerEntry[]; // lorry + date range filtered (truck-wise report)
  lorryEntries: FuelLedgerEntry[]; // lorry filtered only (weekly / monthly / yearly)
  refDay: string;
  regOf: (lorryId: string) => string;
  scopeLabel: string;
}

const inr0 = (n: number) => formatINR(Math.round(n));
const km = (n: number) => Math.round(n).toLocaleString('en-IN');

const Block: React.FC<{ title: string; note: string; children: React.ReactNode }> = ({ title, note, children }) => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-[11px] text-slate-500">{note}</p>
    </div>
    {children}
  </div>
);

export const FuelReportsSection: React.FC<Props> = ({ rangeEntries, lorryEntries, refDay, regOf, scopeLabel }) => {
  const trucks = useMemo(() => groupByLorry(rangeEntries), [rangeEntries]);
  const total = useMemo(() => summarize(rangeEntries), [rangeEntries]);
  const weekly = useMemo(() => bucketByWeek(lorryEntries, refDay, 12), [lorryEntries, refDay]);
  const monthly = useMemo(() => bucketByMonth(lorryEntries, refDay, 12), [lorryEntries, refDay]);
  const yearly = useMemo(() => bucketByYear(lorryEntries), [lorryEntries]);
  const refYear = refDay.slice(0, 4);

  return (
    <div className="space-y-4">
      <Block
        title="Truck-wise report"
        note={`${scopeLabel} · follows the selected lorry and date range. Mileage uses full-tank fills only.`}
      >
        {trucks.length === 0 ? (
          <ProfileEmptyState title="No records" message="No fuel purchases match the chosen lorry and date range." />
        ) : (
          <TableShell
            headers={[
              { label: 'Lorry' },
              { label: 'Fills', right: true },
              { label: 'Litres', right: true },
              { label: 'Spend', right: true },
              { label: 'Distance', right: true },
              { label: 'Mileage', right: true },
              { label: 'Cost / km', right: true },
              { label: 'Share' },
            ]}
          >
            {trucks.map(({ lorryId, summary: s }) => (
              <tr key={lorryId} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-900">{regOf(lorryId)}</td>
                <td className="px-4 py-3 text-right font-mono">{s.fills}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{km(s.litres)} L</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold">{inr0(s.spend)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{km(s.distanceKm)} km</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{s.avgMileage ? `${s.avgMileage.toFixed(2)} km/L` : '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{s.costPerKm ? `₹${s.costPerKm.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(s.litres / total.litres) * 100}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-slate-600">{((s.litres / total.litres) * 100).toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-3 text-slate-900">Total</td>
              <td className="px-4 py-3 text-right font-mono">{total.fills}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{km(total.litres)} L</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{inr0(total.spend)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{km(total.distanceKm)} km</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{total.avgMileage ? `${total.avgMileage.toFixed(2)} km/L` : '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{total.costPerKm ? `₹${total.costPerKm.toFixed(2)}` : '—'}</td>
              <td />
            </tr>
          </TableShell>
        )}
      </Block>

      <Block
        title="Weekly report"
        note={`Last 12 weeks to ${formatDateOnly(`${refDay}T00:00:00Z`)} (weeks start Monday) · ${scopeLabel} · ignores the date range`}
      >
        {lorryEntries.length === 0 ? (
          <ProfileEmptyState title="No records" message="This lorry has no fuel purchases yet." />
        ) : (
          <FuelTrendChart data={weekly} />
        )}
      </Block>

      <Block title="Monthly report" note={`Last 12 months · ${scopeLabel} · ignores the date range`}>
        {lorryEntries.length === 0 ? (
          <ProfileEmptyState title="No records" message="This lorry has no fuel purchases yet." />
        ) : (
          <FuelTrendChart data={monthly} />
        )}
      </Block>

      <Block title="Yearly report" note={`All years on record · ${scopeLabel} · ignores the date range`}>
        {yearly.length === 0 ? (
          <ProfileEmptyState title="No records" message="This lorry has no fuel purchases yet." />
        ) : (
          <TableShell
            headers={[
              { label: 'Year' },
              { label: 'Fills', right: true },
              { label: 'Litres', right: true },
              { label: 'Spend', right: true },
              { label: 'Distance', right: true },
              { label: 'Mileage', right: true },
              { label: 'Cost / km', right: true },
            ]}
          >
            {yearly.map((y) => (
              <tr key={y.key} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                  {y.label}
                  {y.key === refYear && <span className="ml-1.5 text-[10px] font-normal text-slate-400">(to date)</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono">{y.fills}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{km(y.litres)} L</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold">{inr0(y.spend)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{km(y.distanceKm)} km</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{y.avgMileage ? `${y.avgMileage.toFixed(2)} km/L` : '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{y.costPerKm ? `₹${y.costPerKm.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </TableShell>
        )}
      </Block>
    </div>
  );
};
