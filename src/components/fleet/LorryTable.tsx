import React from 'react';
import { Card, CardBody } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Lorry, LorryStatus } from '../../types/lorry';
import {
  Truck,
  Eye,
  Edit2,
  Trash2,
  Phone,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

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
        return <Badge variant="success" size="sm" dot>Active</Badge>;
      case 'Available':
        return <Badge variant="info" size="sm" dot>Available</Badge>;
      case 'On Trip':
        return <Badge variant="info" size="sm" dot>On Trip</Badge>;
      case 'Maintenance':
        return <Badge variant="warning" size="sm" dot>Maintenance</Badge>;
      case 'Inactive':
      default:
        return <Badge variant="neutral" size="sm" dot>Inactive</Badge>;
    }
  };

  if (lorries.length === 0) {
    return (
      <Card>
        <CardBody className="py-14 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Lorries Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No commercial vehicles match your active search or filter criteria. Try adjusting your filters or register a new lorry.
          </p>
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={onAddNew}>
              + Add New Lorry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Registration No.</th>
              <th className="py-3.5 px-4">Vehicle Type</th>
              <th className="py-3.5 px-4">Brand / Model</th>
              <th className="py-3.5 px-4">Owner Name</th>
              <th className="py-3.5 px-4">Driver Assigned</th>
              <th className="py-3.5 px-4 text-right">Load Capacity</th>
              <th className="py-3.5 px-4 text-center">Current Status</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {lorries.map((lorry) => {
              const docCount = [
                lorry.rcDocument,
                lorry.insuranceDocument,
                lorry.fitnessDocument,
                lorry.pucDocument,
                lorry.permitDocument,
              ].filter(Boolean).length;

              return (
                <tr key={lorry.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Registration Number */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails(lorry)}
                      className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-wide bg-blue-50/70 border border-blue-200/70 px-2 py-0.5 rounded text-xs text-left"
                    >
                      {lorry.registrationNumber}
                    </button>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                      <span>{lorry.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <FileCheck2 className="w-3 h-3 text-emerald-600" />
                        {docCount}/5 Docs
                      </span>
                    </div>
                  </td>

                  {/* Vehicle Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {lorry.vehicleType}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lorry.bodyType}</p>
                  </td>

                  {/* Brand / Model */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-800">{lorry.manufacturer}</p>
                    <p className="text-[11px] text-slate-500">{lorry.model} ({lorry.manufacturingYear})</p>
                  </td>

                  {/* Owner Name */}
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <p className="font-semibold text-slate-800 truncate" title={lorry.ownerName}>
                      {lorry.ownerName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                      +91 {lorry.ownerMobile}
                    </p>
                  </td>

                  {/* Driver Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {lorry.driverName ? (
                      <div>
                        <p className="font-medium text-slate-800">{lorry.driverName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {lorry.driverMobile ? `+91 ${lorry.driverMobile}` : 'Phone N/A'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Load Capacity */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    <span className="font-bold text-slate-900">{lorry.loadCapacityTonnes}</span>{' '}
                    <span className="text-slate-500 text-[11px]">Tonnes</span>
                    <p className="text-[10px] text-slate-400">{lorry.numberOfTyres} Tyres</p>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(lorry.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetails(lorry)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(lorry)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                        title="Edit Lorry Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(lorry)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                        title="Delete Lorry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
