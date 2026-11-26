import React from 'react';
import { Badge } from '../../common/Badge';
import { LorryRecordsService } from '../../../services/lorryRecordsService';
import { ExpenseCategory } from '../../../types/lorryRecords';
import { formatDateOnly, formatINR } from '../../../utils/formatters';
import { DemoNote, ProfileEmptyState, StatTile, TableShell } from './ProfileParts';

export const ExpensesTab: React.FC<{ lorryId: string }> = ({ lorryId }) => {
  const rows = LorryRecordsService.getExpenses(lorryId);

  if (rows.length === 0) {
    return <ProfileEmptyState title="No expenses" message="No trip expenses have been recorded for this lorry yet." />;
  }

  const sum = (cat: ExpenseCategory) => rows.filter((r) => r.category === cat).reduce((s, r) => s + r.amount, 0);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const other = total - sum('Toll') - sum('Driver Allowance');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total Expenses" value={formatINR(total)} hint={`${rows.length} entries`} />
        <StatTile label="Tolls" value={formatINR(sum('Toll'))} />
        <StatTile label="Driver Allowances" value={formatINR(sum('Driver Allowance'))} />
        <StatTile label="Other" value={formatINR(other)} hint="Parking, loading, misc." />
      </div>
      <TableShell
        headers={[
          { label: 'Date' },
          { label: 'Category' },
          { label: 'Details' },
          { label: 'Trip' },
          { label: 'Amount', right: true },
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50/70">
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateOnly(r.date)}</td>
            <td className="px-4 py-3">
              <Badge variant="neutral" size="sm">{r.category}</Badge>
            </td>
            <td className="px-4 py-3 text-slate-800">{r.note}</td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{r.tripRef ?? '—'}</td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(r.amount)}</td>
          </tr>
        ))}
      </TableShell>
      <DemoNote />
    </div>
  );
};
