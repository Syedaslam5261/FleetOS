import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FuelStationSummary } from '../../types/diesel';
import { formatINR, formatLiters } from '../../utils/formatters';
import { Building2, MapPin, Fuel, ShieldCheck } from 'lucide-react';

interface FuelStationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: FuelStationSummary[];
}

export const FuelStationsModal: React.FC<FuelStationsModalProps> = ({
  isOpen,
  onClose,
  stations,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fleet Fuel Stations & Highway Outlets"
      subtitle="Authorized fuel retail points, volume filled, and average discounted rates"
      maxWidth="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stations.map((station, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-3.5 hover:border-blue-300 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                    {station.brand}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                    {station.stationName}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{station.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px]">Volume</span>
                  <p className="font-mono font-bold text-slate-800">
                    {formatLiters(station.totalLiters)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Avg Rate</span>
                  <p className="font-mono font-bold text-slate-800">
                    ₹{station.averageRate.toFixed(2)}/L
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Total Spends</span>
                  <p className="font-mono font-bold text-slate-900">
                    {formatINR(station.totalAmount, true)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All outlets integrated with corporate cashless Fleet Cards (IOCL XTRAPOWER & HPCL DriveTrack).</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
