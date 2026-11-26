import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { AlertTriangle, Bell, Clock, CheckCircle, ArrowRight } from 'lucide-react';

interface FuelAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTruck?: (truckNumber: string) => void;
}

export const FuelAlertsModal: React.FC<FuelAlertsModalProps> = ({
  isOpen,
  onClose,
  onViewTruck,
}) => {
  const alerts = [
    {
      id: 'ALT-01',
      severity: 'critical' as const,
      truck: 'HR 55 U 2244',
      title: 'Mileage Alert: Dropped below minimum acceptable threshold',
      description: 'Average mileage fell to 3.36 km/L against target of 3.70 km/L on NH-44 Delhi-Ludhiana run. Check tyre pressure and injection nozzles.',
      time: '4 hours ago',
    },
    {
      id: 'ALT-02',
      severity: 'warning' as const,
      truck: 'KA 04 D 7712',
      title: 'Partial Tank Refills Detected',
      description: '2 consecutive refuels without full tank top-up. Recommend a full-tank fill to recalibrate odometer-based fuel consumption.',
      time: '1 day ago',
    },
    {
      id: 'ALT-03',
      severity: 'info' as const,
      truck: 'MH 12 RN 4821',
      title: 'Efficiency Target Achieved (+5.4%)',
      description: 'Vehicle achieved 3.90 km/L on Mumbai-Bangalore corridor. Driver Sukhwinder Singh qualified for monthly fuel incentive bonus.',
      time: 'Yesterday',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fuel Alerts & Operating Reminders"
      subtitle="Automated exceptions for abnormal consumption, low mileage and audit triggers"
      maxWidth="lg"
    >
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-slate-200 bg-white p-3.5 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {alert.severity === 'critical' ? (
                  <Badge variant="critical" size="sm" dot>Critical</Badge>
                ) : alert.severity === 'warning' ? (
                  <Badge variant="warning" size="sm" dot>Warning</Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>Favorable</Badge>
                )}
                <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {alert.truck}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {alert.time}
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 mt-2">{alert.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => {
                  onViewTruck?.(alert.truck);
                  onClose();
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Inspect Vehicle Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
