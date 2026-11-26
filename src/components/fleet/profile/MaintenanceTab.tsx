import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Badge } from '../../common/Badge';
import { LorryRecordsService } from '../../../services/lorryRecordsService';
import { formatDateOnly, formatINR } from '../../../utils/formatters';
import { DemoNote, ProfileEmptyState, StatTile, TableShell } from './ProfileParts';

export const MaintenanceTab: React.FC<{ lorryId: string }> = ({ lorryId }) => {
  const rows = LorryRecordsService.getMaintenance(lorryId);
  const next = LorryRecordsService.getNextService(lorryId);

  if (rows.length === 0 && !next) {
    return (
      <ProfileEmptyState
        title="No maintenance history"
        message="No services or repairs have been recorded for this lorry, and no next service is scheduled."
      />
    );
  }

  const total = rows.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Total Maintenance Cost" value={formatINR(total)} hint={`${rows.length} jobs`} />
        <StatTile label="Last Service" value={rows[0] ? formatDateOnly(rows[0].date) : '—'} />
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <CalendarClock className="h-3.5 w-3.5" /> Next Service
          </p>
          {next ? (
            <>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{formatDateOnly(next.dueDate)}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                or at {next.dueOdometerKm.toLocaleString('en-IN')} km · {next.description}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-slate-500">Not scheduled</p>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <ProfileEmptyState title="No service history" message="No past services or repairs recorded." />
      ) : (
        <TableShell
          headers={[
            { label: 'Date' },
            { label: 'Type' },
            { label: 'Description' },
            { label: 'Workshop' },
            { label: 'Cost', right: true },
          ]}
        >
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatDateOnly(r.date)}
                <p className="font-mono text-[10px] text-slate-400">{r.odometerKm.toLocaleString('en-IN')} km</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={r.type === 'Repair' ? 'warning' : 'info'} size="sm">
                  {r.type}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-800">{r.description}</td>
              <td className="px-4 py-3 text-slate-600">{r.workshop}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(r.cost)}</td>
            </tr>
          ))}
        </TableShell>
      )}
      <DemoNote />
    </div>
  );
};
