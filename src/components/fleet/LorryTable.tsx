import React from 'react';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { Lorry, LorryStatus } from '../../types/lorry';
import { Eye, Edit2, Trash2, Truck } from 'lucide-react';
import { clsx } from 'clsx';

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
  // Status badge styling matching reference rules:
  // Green for Active, Blue for On Trip, Amber for Maintenance, Green/Teal for Available
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
            <Button variant="primary" size="sm" onClick={onAddNew}>
              + Add Lorry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                {/* 1. Registration No. */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <button
                    onClick={() => onViewDetails(lorry)}
                    className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-wide text-xs text-left"
                  >
                    {lorry.registrationNumber}
                  </button>
                </td>

                {/* 2. Type */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded text-xs">
                    {lorry.vehicleType}
                  </span>
                </td>

                {/* 3. Brand / Model */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <p className="font-semibold text-slate-800">{lorry.manufacturer}</p>
                  <p className="text-[11px] text-slate-500">{lorry.model}</p>
                </td>

                {/* 4. Driver (Driver Name + Phone) */}
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

                {/* 5. Load Capacity */}
                <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                  <span className="font-bold text-slate-900">{lorry.loadCapacityTonnes}</span>{' '}
                  <span className="text-slate-500 text-xs">Tonnes</span>
                </td>

                {/* 6. Status */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  {getStatusBadge(lorry.status)}
                </td>

                {/* 7. Actions (Eye, Pencil, Trash) */}
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
  );
};
