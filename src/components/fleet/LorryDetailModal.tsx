import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Lorry, LorryStatus } from '../../types/lorry';
import {
  Truck,
  Phone,
  CreditCard,
  FileText,
  Gauge,
  Calendar,
  Edit2,
  CheckCircle2,
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

  const documentList = [
    { title: 'RC (Registration Certificate)', doc: lorry.rcDocument },
    { title: 'Insurance Policy Certificate', doc: lorry.insuranceDocument },
    { title: 'Fitness Certificate', doc: lorry.fitnessDocument },
    { title: 'PUC (Pollution Under Control)', doc: lorry.pucDocument },
    { title: 'National / State Permit', doc: lorry.permitDocument },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vehicle Details — ${lorry.registrationNumber}`}
      subtitle={`${lorry.manufacturer} ${lorry.model} • ${lorry.vehicleType}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Header Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {lorry.registrationNumber}
                </span>
                {getStatusBadge(lorry.status)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {lorry.vehicleType} • {lorry.loadCapacityTonnes} Tonnes • {lorry.numberOfTyres} Tyres • {lorry.bodyType}
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
            Edit Lorry
          </Button>
        </div>

        {/* Tab Navigation */}
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
            {/* Technical Specs */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-600" /> Operational & Technical Specs
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

            {/* Driver Details */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Driver Information
              </h4>
              {lorry.driverName ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
                  <div>
                    <span className="text-slate-400 text-[11px]">Assigned Driver:</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{lorry.driverName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Mobile Number:</span>
                    <p className="text-slate-800 font-mono font-medium mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {lorry.driverMobile ? `+91 ${lorry.driverMobile}` : 'N/A'}
                    </p>
                  </div>
                  {lorry.driverLicenceNumber && (
                    <div>
                      <span className="text-slate-400 text-[11px]">Driving Licence:</span>
                      <p className="text-slate-800 font-mono mt-0.5">{lorry.driverLicenceNumber}</p>
                    </div>
                  )}
                  {lorry.licenceExpiryDate && (
                    <div>
                      <span className="text-slate-400 text-[11px]">DL Expiry Date:</span>
                      <p className="text-slate-800 mt-0.5">{lorry.licenceExpiryDate}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-3 text-center text-slate-400 text-xs">
                  No driver assigned currently.
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> Documents & Compliance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {documentList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">{item.title}</span>
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

            {lorry.notes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-700">
                <span className="font-bold text-slate-800">Additional Notes: </span>
                <span>{lorry.notes}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
              Future FleetOS Module
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-2">
              {activeTab === 'trips' && 'Trips Module'}
              {activeTab === 'diesel' && 'Diesel Management Module'}
              {activeTab === 'maintenance' && 'Maintenance Module'}
              {activeTab === 'expenses' && 'Expenses Module'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This sub-section will be integrated when the respective module is activated.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
