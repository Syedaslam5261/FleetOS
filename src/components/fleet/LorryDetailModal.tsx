import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Lorry, LorryStatus } from '../../types/lorry';
import {
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Gauge,
  Calendar,
  Edit2,
  CheckCircle2,
  FileCheck2,
  Clock,
  Layers,
  Fuel,
  Navigation,
  Wrench,
  Receipt
} from 'lucide-react';
import { clsx } from 'clsx';

interface LorryDetailModalProps {
  isOpen: boolean;
  lorry: Lorry | null;
  onClose: () => void;
  onEdit: (lorry: Lorry) => void;
}

export const LorryDetailModal: React.FC<LorryDetailModalProps> = ({
  isOpen,
  lorry,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'trips' | 'diesel' | 'maintenance' | 'expenses'>('profile');

  if (!lorry) return null;

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

  const documentList = [
    { title: 'Registration Certificate (RC)', doc: lorry.rcDocument },
    { title: 'Insurance Policy Certificate', doc: lorry.insuranceDocument },
    { title: 'RTO Fitness Certificate', doc: lorry.fitnessDocument },
    { title: 'Pollution Under Control (PUC)', doc: lorry.pucDocument },
    { title: 'National / State Permit', doc: lorry.permitDocument },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vehicle Profile — ${lorry.registrationNumber}`}
      subtitle={`${lorry.manufacturer} ${lorry.model} • ${lorry.vehicleType}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Header Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                  {lorry.registrationNumber}
                </span>
                {getStatusBadge(lorry.status)}
                <span className="text-xs text-slate-500 font-medium">
                  {lorry.vehicleType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Chassis: {lorry.bodyType} • {lorry.numberOfTyres} Tyres • Load: {lorry.loadCapacityTonnes} Tonnes
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => {
              onClose();
              onEdit(lorry);
            }}
          >
            Edit Profile
          </Button>
        </div>

        {/* Tab Navigation (with placeholders for future modules) */}
        <div className="flex items-center gap-1 border-b border-slate-200 text-xs overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('profile')}
            className={clsx(
              'px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Layers className="w-3.5 h-3.5" /> Vehicle Overview & Docs
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={clsx(
              'px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'trips'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            )}
          >
            <Navigation className="w-3.5 h-3.5" /> Trips (Future)
          </button>

          <button
            onClick={() => setActiveTab('diesel')}
            className={clsx(
              'px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'diesel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            )}
          >
            <Fuel className="w-3.5 h-3.5" /> Diesel (Future)
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={clsx(
              'px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'maintenance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            )}
          >
            <Wrench className="w-3.5 h-3.5" /> Maintenance (Future)
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={clsx(
              'px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'expenses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            )}
          >
            <Receipt className="w-3.5 h-3.5" /> Expenses (Future)
          </button>
        </div>

        {/* Tab 1: Profile & Details */}
        {activeTab === 'profile' ? (
          <div className="space-y-4">
            {/* Grid 1: Technical & Operational Specs */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-600" /> Technical & Operational Specs
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Odometer Reading</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {lorry.odometerReadingKm.toLocaleString('en-IN')} km
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Load Rating</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {lorry.loadCapacityTonnes} Tonnes
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Mfg Year</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {lorry.manufacturingYear}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Colour & Tyres</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {lorry.vehicleColour} • {lorry.numberOfTyres}T
                  </p>
                </div>
              </div>

              {(lorry.registrationExpiryDate || lorry.insuranceExpiryDate) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
                  {lorry.registrationExpiryDate && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>RC Expiry: <strong className="text-slate-800">{lorry.registrationExpiryDate}</strong></span>
                    </div>
                  )}
                  {lorry.insuranceExpiryDate && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Insurance Expiry: <strong className="text-slate-800">{lorry.insuranceExpiryDate}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid 2: Owner & Driver Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Info */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" /> Registered Owner
                </h4>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 text-sm">{lorry.ownerName}</p>
                  {lorry.companyName && (
                    <p className="text-slate-600 font-medium">{lorry.companyName}</p>
                  )}
                  <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" /> +91 {lorry.ownerMobile}
                  </p>
                  {lorry.ownerEmail && (
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {lorry.ownerEmail}
                    </p>
                  )}
                  {lorry.ownerAddress && (
                    <p className="text-slate-500 flex items-start gap-1.5 pt-1 text-[11px] leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" /> {lorry.ownerAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Driver Info */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Driver on Duty
                </h4>
                {lorry.driverName ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 text-sm">{lorry.driverName}</p>
                    <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" /> +91 {lorry.driverMobile || 'N/A'}
                    </p>
                    {lorry.driverLicenceNumber && (
                      <p className="text-slate-600 font-mono">
                        DL: <strong className="text-slate-800">{lorry.driverLicenceNumber}</strong>
                      </p>
                    )}
                    {lorry.licenceExpiryDate && (
                      <p className="text-[11px] text-slate-500">
                        DL Expiry: {lorry.licenceExpiryDate}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    <p>No driver assigned currently.</p>
                    <p className="text-[11px] mt-0.5">Edit this lorry to allocate an authorized commercial driver.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 3: Compliance & Documents */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> Compliance Records & Attached Files
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documentList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{item.title}</p>
                      {item.doc ? (
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={item.doc.name}>
                          {item.doc.name} ({(item.doc.size / 1024).toFixed(0)} KB)
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No document attached</p>
                      )}
                    </div>
                    {item.doc ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {lorry.notes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs text-slate-700">
                <span className="font-bold text-slate-800">Operational Notes: </span>
                <span>{lorry.notes}</span>
              </div>
            )}
          </div>
        ) : (
          /* Future Modules Placeholder */
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
              Future FleetOS Module
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-2">
              {activeTab === 'trips' && 'Vehicle Trips & Consignments Tab'}
              {activeTab === 'diesel' && 'Vehicle Fuel Consumption & Mileage Tab'}
              {activeTab === 'maintenance' && 'Vehicle Service Logs & Job Cards Tab'}
              {activeTab === 'expenses' && 'Vehicle Toll & Operational Expenses Tab'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This sub-section will be integrated when the respective module is built according to the modular FleetOS roadmap.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab('profile')}>
                Back to Vehicle Overview
              </Button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
