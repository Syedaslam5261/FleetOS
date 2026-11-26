import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MileageTargetSetting } from '../../types/diesel';
import { Target, CheckCircle2, TrendingUp, Award } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface MileageTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: MileageTargetSetting[];
  onSaveTargets: (updated: MileageTargetSetting[]) => Promise<void>;
}

export const MileageTargetModal: React.FC<MileageTargetModalProps> = ({
  isOpen,
  onClose,
  targets,
  onSaveTargets,
}) => {
  const [localTargets, setLocalTargets] = useState<MileageTargetSetting[]>([...targets]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdate = (truckId: string, field: keyof MileageTargetSetting, value: number) => {
    setLocalTargets((prev) =>
      prev.map((t) => (t.truckId === truckId ? { ...t, [field]: value } : t))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveTargets(localTargets);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Truck Mileage Targets & Driver Incentives"
      subtitle="Establish fuel efficiency benchmarks to drive lower cost per km and reduce fuel theft"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {savedSuccess && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mileage targets and driver incentive brackets updated successfully!</span>
          </div>
        )}

        <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Incentive Policy Guidelines</p>
            <p className="text-[11px] text-blue-800 mt-0.5">
              Drivers exceeding the target mileage on long-haul routes receive monthly performance bonuses. Alerts trigger if mileage drops below the minimum acceptable threshold.
            </p>
          </div>
        </div>

        {/* Table of Targets */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Target Mileage (km/L)</th>
                <th className="py-2.5 px-3">Min Threshold (km/L)</th>
                <th className="py-2.5 px-3">Monthly Driver Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localTargets.map((item) => (
                <tr key={item.truckId} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {item.truckNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.05"
                        min="2.0"
                        max="8.0"
                        value={item.currentTarget}
                        onChange={(e) =>
                          handleUpdate(item.truckId, 'currentTarget', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px]">km/L</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.05"
                        min="2.0"
                        max="8.0"
                        value={item.minAcceptableTarget}
                        onChange={(e) =>
                          handleUpdate(item.truckId, 'minAcceptableTarget', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-rose-700 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px]">km/L</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        step="250"
                        min="0"
                        value={item.driverIncentiveBonus || 0}
                        onChange={(e) =>
                          handleUpdate(item.truckId, 'driverIncentiveBonus', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          <Button variant="primary" size="md" isLoading={isSaving} onClick={handleSave}>
            Save Targets & Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
};
