import React, { useMemo } from 'react';
import { Fuel, Gauge, IndianRupee, Navigation2 } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { ProfileEmptyState } from '../fleet/profile/ProfileParts';
import { FuelLedgerEntry } from '../../types/fuel';
import { groupByLorry, summarize } from '../../utils/fuelAnalytics';
import { formatINR } from '../../utils/formatters';

interface Props {
  entries: FuelLedgerEntry[]; // already filtered by lorry + date range
  regOf: (lorryId: string) => string;
  scopeLabel: string;
}

const inr0 = (n: number) => formatINR(Math.round(n));

export const FuelOverviewSection: React.FC<Props> = ({ entries, regOf, scopeLabel }) => {
  const s = useMemo(() => summarize(entries), [entries]);
  const byLorry = useMemo(() => groupByLorry(entries), [entries]);

  if (entries.length === 0) {
    return (
      <ProfileEmptyState
        title="No diesel records for this selection"
        message="No fuel purchases match the chosen lorry and date range. Try a wider range or reset the filters."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Diesel Consumed"
          value={Math.round(s.litres).toLocaleString('en-IN')}
          unit="Litres"
          icon={<Fuel className="h-5 w-5" />}
          accentColor="blue"
          secondaryText={`${s.fills} fills`}
        />
        <StatCard
          title="Diesel Spend"
          value={inr0(s.spend)}
          icon={<IndianRupee className="h-5 w-5" />}
          accentColor="indigo"
          secondaryText={s.avgRate ? `Avg ₹${s.avgRate.toFixed(2)}/L` : undefined}
        />
        <StatCard
          title="Average Mileage"
          value={s.avgMileage ? s.avgMileage.toFixed(2) : '—'}
          unit={s.avgMileage ? 'km/L' : undefined}
          icon={<Gauge className="h-5 w-5" />}
          accentColor="emerald"
          tooltip="Calculated from full-tank fills only. Partial fills are excluded because they cannot give a reliable km/L."
          secondaryText={`${s.fullTankFills} full-tank fills`}
        />
        <StatCard
          title="Fuel Cost per km"
          value={s.costPerKm ? `₹${s.costPerKm.toFixed(2)}` : '—'}
          icon={<Navigation2 className="h-5 w-5" />}
          accentColor="amber"
          tooltip="Total diesel spend divided by distance covered between fills."
          secondaryText={`${Math.round(s.distanceKm).toLocaleString('en-IN')} km covered`}
        />
      </div>

      {s.partialFills > 0 && (
        <p className="text-[11px] text-slate-500">
          {s.partialFills} of {s.fills} fills were partial top-ups. They count toward litres, spend and cost per km, but are
          excluded from mileage.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Consumption by lorry · {scopeLabel}</h4>
        <ul className="mt-4 space-y-3">
          {byLorry.map(({ lorryId, summary }) => {
            const share = (summary.litres / s.litres) * 100;
            return (
              <li key={lorryId}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-mono font-bold text-slate-900">{regOf(lorryId)}</span>
                  <span className="text-slate-600">
                    <span className="font-mono font-semibold text-slate-900">
                      {Math.round(summary.litres).toLocaleString('en-IN')} L
                    </span>{' '}
                    · {inr0(summary.spend)} · {share.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
