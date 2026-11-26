import React from 'react';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { PlusCircle, BarChart3, Building2, Target, BellRing } from 'lucide-react';

interface QuickActionsProps {
  onAddFuelEntry: () => void;
  onViewReports: () => void;
  onFuelStations: () => void;
  onSetMileageTarget: () => void;
  onAlertsReminders: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddFuelEntry,
  onViewReports,
  onFuelStations,
  onSetMileageTarget,
  onAlertsReminders,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-card">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Operational Actions
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Log refills, manage fuel stations, tune vehicle mileage targets, and review alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* 1. Add Fuel Entry */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={onAddFuelEntry}
            className="flex-1 sm:flex-initial"
          >
            Add Fuel Entry
          </Button>

          {/* 2. Fuel Stations */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Building2 className="w-4 h-4 text-blue-600" />}
            onClick={onFuelStations}
            className="flex-1 sm:flex-initial"
          >
            Fuel Stations
          </Button>

          {/* 3. Set Mileage Target */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Target className="w-4 h-4 text-emerald-600" />}
            onClick={onSetMileageTarget}
            className="flex-1 sm:flex-initial"
          >
            Set Mileage Target
          </Button>

          {/* 4. Alerts & Reminders */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BellRing className="w-4 h-4 text-amber-600" />}
            onClick={onAlertsReminders}
            className="flex-1 sm:flex-initial"
          >
            Alerts & Reminders
          </Button>

          {/* 5. View Reports */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BarChart3 className="w-4 h-4 text-slate-600" />}
            onClick={onViewReports}
            className="flex-1 sm:flex-initial"
          >
            Diesel Reports
          </Button>
        </div>
      </div>
    </div>
  );
};
