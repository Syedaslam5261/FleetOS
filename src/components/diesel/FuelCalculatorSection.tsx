import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { FuelLedgerEntry, LorryOption } from '../../types/fuel';
import { calcFuelEstimate, filterEntries, summarize } from '../../utils/fuelAnalytics';
import { formatINR } from '../../utils/formatters';

interface Props {
  ledger: FuelLedgerEntry[]; // used to suggest mileage and price
  lorries?: LorryOption[];
  /** When set, locks the calculator to this single lorry (no other lorries shown). */
  lockedLorry?: LorryOption;
}

const field =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export const FuelCalculatorSection: React.FC<Props> = ({ ledger, lorries = [], lockedLorry }) => {
  const suggest = (targetId: string) => {
    const rows = filterEntries(ledger, targetId);
    const s = summarize(rows);
    return {
      mileage: s.avgMileage ? s.avgMileage.toFixed(2) : '',
      price: rows[0] ? rows[0].ratePerLitre.toFixed(2) : '', // ledger is newest-first
      fullFills: s.fullTankFills,
    };
  };

  const defaultId = lockedLorry ? lockedLorry.id : 'ALL';
  const [lorryId, setLorryId] = useState(defaultId);
  const initial = useMemo(() => suggest(defaultId), [defaultId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [distance, setDistance] = useState('1000');
  const [mileage, setMileage] = useState(initial.mileage);
  const [price, setPrice] = useState(initial.price);
  const activeId = lockedLorry ? lockedLorry.id : lorryId;
  const hint = useMemo(() => suggest(activeId), [activeId, ledger]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLorry = (id: string) => {
    setLorryId(id);
    const s = suggest(id);
    setMileage(s.mileage);
    setPrice(s.price);
  };

  const d = parseFloat(distance), m = parseFloat(mileage), p = parseFloat(price);
  const result = calcFuelEstimate(d, m, p);
  const touched = distance !== '' || mileage !== '' || price !== '';
  const error = !result && touched ? 'Enter a distance, mileage and fuel price greater than zero to see an estimate.' : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {lockedLorry ? (
          <div>
            <p className="text-xs font-semibold text-slate-700">
              Vehicle: <span className="font-mono font-bold text-slate-900">{lockedLorry.label}</span>
            </p>
            <span className="mt-1 block text-[11px] text-slate-500">
              {hint.fullFills > 0
                ? `Suggested from ${hint.fullFills} recorded full-tank fills and the latest purchase rate for this lorry. You can edit both.`
                : 'No recorded fills for this lorry. Enter mileage and price manually.'}
            </span>
          </div>
        ) : (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Use mileage and price from</span>
            <select
              value={lorryId}
              onChange={(e) => onLorry(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Fleet average</option>
              {lorries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-slate-500">
              {hint.fullFills > 0
                ? `Suggested from ${hint.fullFills} recorded full-tank fills and the latest purchase rate. You can edit both.`
                : 'No recorded fills for this lorry. Enter mileage and price manually.'}
            </span>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Distance to travel (km)</span>
          <input type="number" min="0" step="any" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Mileage (km/L)</span>
            <input type="number" min="0" step="any" inputMode="decimal" value={mileage} onChange={(e) => setMileage(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Fuel price (₹/L)</span>
            <input type="number" min="0" step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
          <Calculator className="h-4 w-4" /> Estimated requirement
        </h4>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-xs text-slate-500">Diesel needed</dt>
            <dd className="font-mono text-3xl font-bold tracking-tight text-slate-900">
              {result ? `${result.litres.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L` : '—'}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-slate-500">Estimated cost</dt>
              <dd className="font-mono text-xl font-bold text-slate-900">{result ? formatINR(Math.round(result.cost)) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Cost per km</dt>
              <dd className="font-mono text-xl font-bold text-slate-900">{result ? `₹${result.costPerKm.toFixed(2)}` : '—'}</dd>
            </div>
          </div>
        </dl>
        <p className="mt-4 text-[11px] text-slate-500">
          Estimate only: litres = distance ÷ mileage, cost = litres × price. It is not a recorded purchase and does not
          include tank reserve, load, terrain or traffic.
        </p>
      </div>
    </div>
  );
};
