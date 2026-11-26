import React from 'react';
import { Badge } from '../../common/Badge';
import { LorryRecordsService } from '../../../services/lorryRecordsService';
import { InvoiceStatus } from '../../../types/lorryRecords';
import { formatDateOnly, formatINR } from '../../../utils/formatters';
import { DemoNote, ProfileEmptyState, StatTile, TableShell } from './ProfileParts';

const statusVariant: Record<InvoiceStatus, 'success' | 'warning' | 'critical'> = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'critical',
};

export const InvoiceTab: React.FC<{ lorryId: string }> = ({ lorryId }) => {
  const invoices = LorryRecordsService.getInvoices(lorryId);

  if (invoices.length === 0) {
    return <ProfileEmptyState title="No invoices" message="No invoices have been raised for this lorry yet." />;
  }

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Total Invoiced" value={formatINR(total)} hint={`${invoices.length} invoices`} />
        <StatTile label="Received" value={formatINR(paid)} />
        <StatTile label="Outstanding" value={formatINR(total - paid)} />
      </div>
      <TableShell
        headers={[
          { label: 'Invoice No.' },
          { label: 'Date' },
          { label: 'Client' },
          { label: 'Trip' },
          { label: 'Amount', right: true },
          { label: 'Status' },
        ]}
      >
        {invoices.map((inv) => (
          <tr key={inv.id} className="hover:bg-slate-50/70">
            <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">{inv.invoiceNo}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatDateOnly(inv.date)}
              <p className="text-[10px] text-slate-400">Due {formatDateOnly(inv.dueDate)}</p>
            </td>
            <td className="px-4 py-3 text-slate-800">{inv.client}</td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{inv.tripRef}</td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">
              {formatINR(inv.amount)}
            </td>
            <td className="px-4 py-3">
              <Badge variant={statusVariant[inv.status]} size="sm" dot>
                {inv.status}
              </Badge>
            </td>
          </tr>
        ))}
      </TableShell>
      <DemoNote />
    </div>
  );
};
