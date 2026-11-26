import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DieselEntry } from '../../types/diesel';
import { formatINR, formatLiters, formatDate, formatMileage } from '../../utils/formatters';
import { 
  Fuel, 
  Search, 
  Filter, 
  CheckCircle, 
  Info, 
  Download, 
  ExternalLink,
  Receipt
} from 'lucide-react';
import { clsx } from 'clsx';

interface FuelEntriesTableProps {
  entries: DieselEntry[];
  onAddEntry: () => void;
  onViewDetails?: (entry: DieselEntry) => void;
}

export const FuelEntriesTable: React.FC<FuelEntriesTableProps> = ({
  entries,
  onAddEntry,
  onViewDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'full_tank' | 'partial'>('all');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.fuelStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tripReference && entry.tripReference.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'full_tank') return entry.isFullTank;
    if (filterType === 'partial') return !entry.isFullTank;

    return true;
  });

  const getStationBadge = (brand: string) => {
    switch (brand) {
      case 'IndianOil':
        return <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-medium">IOCL</span>;
      case 'HP':
        return <span className="bg-blue-100 text-blue-900 border border-blue-200 text-[10px] px-1.5 py-0.5 rounded font-medium">HPCL</span>;
      case 'Bharat Petroleum':
        return <span className="bg-yellow-100 text-yellow-900 border border-yellow-300 text-[10px] px-1.5 py-0.5 rounded font-medium">BPCL</span>;
      case 'Reliance':
        return <span className="bg-red-100 text-red-900 border border-red-200 text-[10px] px-1.5 py-0.5 rounded font-medium">Jio-bp</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-medium">Pump</span>;
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            <span>Recent Fuel Entries & Invoices</span>
            <span className="text-xs font-normal text-slate-400">({entries.length} recorded)</span>
          </div>
        }
        subtitle="Audited diesel transactions with odometer readings, station location and calculated mileage"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => alert('Exporting Diesel Invoices as CSV / Excel (Ready for ERP integration)...')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Fuel className="w-3.5 h-3.5" />}
              onClick={onAddEntry}
            >
              + Add Entry
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by truck (e.g. MH 12), station, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filter:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={clsx(
                'rounded-md px-2.5 py-1 transition-colors',
                filterType === 'all' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All Fills
            </button>
            <button
              onClick={() => setFilterType('full_tank')}
              className={clsx(
                'rounded-md px-2.5 py-1 transition-colors',
                filterType === 'full_tank' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Full Tank Only
            </button>
            <button
              onClick={() => setFilterType('partial')}
              className={clsx(
                'rounded-md px-2.5 py-1 transition-colors',
                filterType === 'partial' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Partial Top-up
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Truck & Driver</th>
              <th className="py-3 px-4">Fuel Station</th>
              <th className="py-3 px-4 text-right">Quantity (L)</th>
              <th className="py-3 px-4 text-right">Rate / L</th>
              <th className="py-3 px-4 text-right">Total Cost (₹)</th>
              <th className="py-3 px-4 text-center">Mileage (km/L)</th>
              <th className="py-3 px-4">Trip Reference</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No fuel entries matching the criteria.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Date & Time */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{formatDate(entry.date)}</p>
                    <p className="text-[10px] font-mono text-slate-400">{entry.id}</p>
                  </td>

                  {/* Truck & Driver */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-mono font-bold text-slate-900">{entry.truckNumber}</p>
                    <p className="text-slate-500 text-[11px]">{entry.driverName}</p>
                  </td>

                  {/* Fuel Station */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      {getStationBadge(entry.stationBrand)}
                      <span className="font-medium text-slate-800 truncate" title={entry.fuelStation}>
                        {entry.fuelStation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                      <span>Odo: {entry.odometerReadingKm.toLocaleString('en-IN')} km</span>
                      {entry.receiptNumber && <span>• {entry.receiptNumber}</span>}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-900">
                    {formatLiters(entry.liters)}
                  </td>

                  {/* Rate */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-600">
                    ₹{entry.ratePerLiter.toFixed(2)}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                    {formatINR(entry.totalAmount)}
                  </td>

                  {/* Mileage & Calculation Status */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {entry.calculatedMileage ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-900">
                          {entry.calculatedMileage.toFixed(2)} km/L
                        </span>
                        {entry.mileageStatus === 'FULL_TANK_VERIFIED' ? (
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Full-Tank
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 rounded">
                            Estimate
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Trip Reference */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {entry.tripReference ? (
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {entry.tripReference}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unlinked</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails?.(entry)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs p-1 rounded hover:bg-blue-50"
                      title="View voucher details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Showing <strong className="text-slate-700">{filteredEntries.length}</strong> of{' '}
          <strong className="text-slate-700">{entries.length}</strong> entries
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Full-tank to full-tank verified
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Partial fill estimate
          </span>
        </div>
      </div>
    </Card>
  );
};
