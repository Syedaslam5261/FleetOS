import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { VehicleType, LorryStatus, LorryFilterParams } from '../../types/lorry';
import { Button } from '../common/Button';

interface LorryFilterBarProps {
  filters: LorryFilterParams;
  onFilterChange: (updates: Partial<LorryFilterParams>) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

const VEHICLE_TYPES: VehicleType[] = [
  '32 FT SXL',
  '32 FT MXL',
  '20 FT',
  '14 FT',
  '10 FT',
  'Trailer',
  'Other',
];

const LORRY_STATUSES: LorryStatus[] = [
  'Available',
  'Active',
  'On Trip',
  'Maintenance',
  'Inactive',
];

export const LorryFilterBar: React.FC<LorryFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
}) => {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.vehicleType !== 'ALL' ||
    filters.status !== 'ALL';

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registration number (e.g. MH 12, NL 01), owner, or driver..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Type:</span>
            <select
              value={filters.vehicleType}
              onChange={(e) =>
                onFilterChange({ vehicleType: e.target.value as 'ALL' | VehicleType })
              }
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Vehicle Types</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Operational Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={filters.status}
              onChange={(e) =>
                onFilterChange({ status: e.target.value as 'ALL' | LorryStatus })
              }
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Operational Statuses</option>
              {LORRY_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
              onClick={onResetFilters}
              title="Reset all filters"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Results status indicator */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
        <div>
          Showing <strong className="text-slate-800">{filteredCount}</strong> of{' '}
          <strong className="text-slate-800">{totalCount}</strong> commercial lorries
          {isFiltered && <span className="text-blue-600 font-medium ml-1.5">(Filtered)</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active / On Trip
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Maintenance
          </span>
        </div>
      </div>
    </div>
  );
};
