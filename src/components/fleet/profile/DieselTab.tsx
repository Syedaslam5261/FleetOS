import React from 'react';
import { LorryRecordsService } from '../../../services/lorryRecordsService';
import { calculateMileage } from '../../../utils/calculations';
import { formatDateOnly, formatINR, formatLiters } from '../../../utils/formatters';
import { DemoNote, ProfileEmptyState, StatTile, TableShell } from './ProfileParts';

export const DieselTab: React.FC<{ lorryId: string }> = ({ lorryId }) => {
  const rows = LorryRecordsService.getDiesel(lorryId);

  if (rows.length === 0) {
    return <ProfileEmptyState title="No diesel entries" message="No fuel entries have been recorded for this lorry yet." />;
  }

  const litres = rows.reduce((s, r) => s + r.litres, 0);
  const cost = rows.reduce((s, r) => s + r.amount, 0);
  const distance = rows.reduce((s, r) => s + r.distanceKm, 0);
  const avgMileage = distance / litres;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total Diesel" value={formatLiters(litres)} hint={`${rows.length} fills`} />
        <StatTile label="Total Fuel Cost" value={formatINR(cost)} />
        <StatTile label="Average Mileage" value={`${avgMileage.toFixed(2)} km/L`} hint="Distance ÷ litres" />
        <StatTile label="Cost per km" value={`₹${(cost / distance).toFixed(2)}`} hint="Fuel cost ÷ distance" />
      </div>
      <TableShell
        headers={[
          { label: 'Date' },
          { label: 'Station' },
          { label: 'Litres', right: true },
          { label: 'Rate / L', right: true },
          { label: 'Amount', right: true },
          { label: 'Mileage', right: true },
        ]}
      >
        {rows.map((r) => {
          const { mileage, status } = calculateMileage(r.distanceKm, r.litres, r.fullTank);
          return (
            <tr key={r.id} className="hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatDateOnly(r.date)}
                <p className="font-mono text-[10px] text-slate-400">Odo {r.odometerKm.toLocaleString('en-IN')} km</p>
              </td>
              <td className="px-4 py-3 text-slate-800">{r.station}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold">{formatLiters(r.litres)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-600">₹{r.ratePerLitre.toFixed(2)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(r.amount)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono">
                {mileage ? `${mileage.toFixed(2)} km/L` : '—'}
                <p className="text-[10px] font-sans text-slate-400">
                  {status === 'FULL_TANK_VERIFIED' ? 'Full-tank' : 'Estimate (partial)'}
                </p>
              </td>
            </tr>
          );
        })}
      </TableShell>
      <DemoNote />
    </div>
  );
};
