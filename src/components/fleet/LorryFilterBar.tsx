import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { VehicleType, LorryStatus, LorryFilterParams } from '../../types/lorry';

interface LorryFilterBarProps {
  filters: LorryFilterParams;
  onFilterChange: (updates: Partial<LorryFilterParams>) => void;
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
  'Active',
  'On Trip',
  'Maintenance',
  'Available',
  'Inactive',
];

export const LorryFilterBar: React.FC<LorryFilterBarProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search by registration number or driver name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reg number or driver..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Vehicle Type dropdown */}
        <div>
          <select
            value={filters.vehicleType}
            onChange={(e) =>
              onFilterChange({ vehicleType: e.target.value as 'ALL' | VehicleType })
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Vehicle Types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Status dropdown */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as 'ALL' | LorryStatus })
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            {LORRY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={filters.dateFilter || ''}
            onChange={(e) => onFilterChange({ dateFilter: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
