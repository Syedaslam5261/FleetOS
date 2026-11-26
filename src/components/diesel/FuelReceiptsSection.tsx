import React, { useMemo, useState } from 'react';
import { Badge } from '../common/Badge';
import { ProfileEmptyState, TableShell } from '../fleet/profile/ProfileParts';
import { FuelLedgerEntry, VerificationStatus } from '../../types/fuel';
import { formatDateOnly, formatINR, formatLiters } from '../../utils/formatters';

interface Props {
  entries: FuelLedgerEntry[]; // already filtered by lorry + date range; newest first
  regOf: (lorryId: string) => string;
}

const PAGE = 10;
const VARIANT: Record<VerificationStatus, 'success' | 'warning' | 'critical'> = {
  Verified: 'success',
  Pending: 'warning',
  Flagged: 'critical',
};

export const FuelReceiptsSection: React.FC<Props> = ({ entries, regOf }) => {
  const [status, setStatus] = useState<'ALL' | VerificationStatus>('ALL');
  const [visible, setVisible] = useState(PAGE);

  const counts = useMemo(
    () => ({
      Verified: entries.filter((e) => e.verification === 'Verified').length,
      Pending: entries.filter((e) => e.verification === 'Pending').length,
      Flagged: entries.filter((e) => e.verification === 'Flagged').length,
    }),
    [entries]
  );
  const rows = useMemo(() => (status === 'ALL' ? entries : entries.filter((e) => e.verification === status)), [entries, status]);

  if (entries.length === 0) {
    return (
      <ProfileEmptyState
        title="No fuel receipts for this selection"
        message="No diesel purchases match the chosen lorry and date range."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          <strong className="text-emerald-700">{counts.Verified}</strong> verified ·{' '}
          <strong className="text-amber-700">{counts.Pending}</strong> pending ·{' '}
          <strong className="text-rose-700">{counts.Flagged}</strong> flagged
        </p>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          Verification
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'ALL' | VerificationStatus);
              setVisible(PAGE);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Flagged">Flagged</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <ProfileEmptyState title="No receipts with this status" message="Choose another verification status." />
      ) : (
        <TableShell
          headers={[
            { label: 'Date' },
            { label: 'Lorry' },
            { label: 'Station' },
            { label: 'Receipt No.' },
            { label: 'Litres', right: true },
            { label: 'Rate / L', right: true },
            { label: 'Amount', right: true },
            { label: 'Payment' },
            { label: 'Verification' },
          ]}
        >
          {rows.slice(0, visible).map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatDateOnly(e.date)}
                <p className="font-mono text-[10px] text-slate-400">Odo {e.odometerKm.toLocaleString('en-IN')} km</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-900">{regOf(e.lorryId)}</td>
              <td className="px-4 py-3 text-slate-800">
                {e.station}
                {!e.fullTank && <p className="text-[10px] text-amber-700">Partial fill</p>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{e.receiptNo}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold">{formatLiters(e.litres)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-600">₹{e.ratePerLitre.toFixed(2)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(e.amount)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{e.paymentMode}</td>
              <td className="px-4 py-3">
                <Badge variant={VARIANT[e.verification]} size="sm" dot>
                  {e.verification}
                </Badge>
                {e.flagReason && <p className="mt-1 max-w-[180px] text-[10px] text-rose-700">{e.flagReason}</p>}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {Math.min(visible, rows.length)} of {rows.length}
        </span>
        {visible < rows.length && (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Show 10 more
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400">
        Demo data. Receipt numbers and verification statuses are sample values; no receipt files are stored or checked.
      </p>
    </div>
  );
};
