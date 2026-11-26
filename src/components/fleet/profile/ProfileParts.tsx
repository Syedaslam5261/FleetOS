import React from 'react';
import { Inbox } from 'lucide-react';

export const ProfileEmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-12 px-6 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <Inbox className="h-5 w-5" />
    </div>
    <h4 className="text-sm font-bold text-slate-800">{title}</h4>
    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">{message}</p>
  </div>
);

export const StatTile: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{value}</p>
    {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
  </div>
);

export const TableShell: React.FC<{ headers: Array<{ label: string; right?: boolean }>; children: React.ReactNode }> = ({
  headers,
  children,
}) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-600">
          <tr>
            {headers.map((h) => (
              <th key={h.label} className={`px-4 py-3 ${h.right ? 'text-right' : ''}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  </div>
);

export const DemoNote: React.FC = () => (
  <p className="text-[11px] text-slate-400">Demo data for this lorry. Not connected to a backend yet.</p>
);
