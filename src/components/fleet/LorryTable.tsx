import React from 'react';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { Lorry, LorryStatus } from '../../types/lorry';
import { Eye, Edit2, Trash2, Truck, ChevronRight } from 'lucide-react';

interface LorryTableProps {
  lorries: Lorry[];
  onViewDetails: (lorry: Lorry) => void;
  onEdit: (lorry: Lorry) => void;
  onDelete: (lorry: Lorry) => void;
  onAddNew: () => void;
}

export const LorryTable: React.FC<LorryTableProps> = ({
  lorries,
  onViewDetails,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const getStatusBadge = (status: LorryStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'On Trip':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            On Trip
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Available
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        );
    }
  };

  if (lorries.length === 0) {
    return (
      <Card>
        <CardBody className="py-14 text-center">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Lorries Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No commercial vehicles match your active search or filter criteria.
          </p>
          <div className="mt-4">
            <Button variant="primary" size="md" onClick={onAddNew} className="min-h-[44px]">
              + Add Lorry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile Card List (< 768px) — zero horizontal scrolling, 44px touch targets */}
      <div className="space-y-3 md:hidden">
        {lorries.map((lorry) => (
          <div
            key={lorry.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
          >
            <button
              type="button"
              onClick={() => onViewDetails(lorry)}
              className="flex w-full items-start justify-between gap-2 text-left"
            >
              <div className="min-w-0">
                <p className="font-mono text-base font-bold tracking-wide text-blue-700">
                  {lorry.registrationNumber}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {lorry.vehicleType} · {lorry.manufacturer} {lorry.model}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {getStatusBadge(lorry.status)}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Driver</p>
                {lorry.driverName ? (
                  <>
                    <p className="truncate font-semibold text-slate-800">{lorry.driverName}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {lorry.driverMobile ? `+91 ${lorry.driverMobile}` : 'Phone N/A'}
                    </p>
                  </>
                ) : (
                  <p className="italic text-slate-400">Unassigned</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Load Capacity</p>
                <p className="font-bold text-slate-900 text-sm">{lorry.loadCapacityTonnes} Tonnes</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onViewDetails(lorry)}
                className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Eye className="h-4 w-4" /> Open Lorry
              </button>
              <button
                type="button"
                onClick={() => onEdit(lorry)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                aria-label={`Edit ${lorry.registrationNumber}`}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(lorry)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                aria-label={`Delete ${lorry.registrationNumber}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Registration No.</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Brand / Model</th>
                <th className="py-3.5 px-4 font-semibold">Driver</th>
                <th className="py-3.5 px-4 font-semibold">Load Capacity</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {lorries.map((lorry) => (
                <tr key={lorry.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails(lorry)}
                      className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-wide text-xs text-left"
                    >
                      {lorry.registrationNumber}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded text-xs">
                      {lorry.vehicleType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-800">{lorry.manufacturer}</p>
                    <p className="text-[11px] text-slate-500">{lorry.model}</p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {lorry.driverName ? (
                      <div>
                        <p className="font-semibold text-slate-800">{lorry.driverName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {lorry.driverMobile ? `+91 ${lorry.driverMobile}` : 'Phone N/A'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                    <span className="font-bold text-slate-900">{lorry.loadCapacityTonnes}</span>{' '}
                    <span className="text-slate-500 text-xs">Tonnes</span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(lorry.status)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetails(lorry)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(lorry)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                        title="Edit Lorry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(lorry)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                        title="Delete Lorry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
