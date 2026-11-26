import React from 'react';
import { Truck, CheckCircle2, Navigation, Wrench, Clock, ShieldAlert } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { LorrySummaryMetrics } from '../../types/lorry';

interface LorrySummaryCardsProps {
  metrics: LorrySummaryMetrics;
}

export const LorrySummaryCards: React.FC<LorrySummaryCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Total Lorries */}
      <StatCard
        title="Total Lorries"
        value={metrics.totalLorries.toString()}
        unit="Vehicles"
        icon={<Truck className="w-5 h-5" />}
        accentColor="blue"
        tooltip="Total registered commercial transport lorries in FleetOS"
        secondaryText="Active Fleet Roster"
      />

      {/* 2. Active Lorries */}
      <StatCard
        title="Active Lorries"
        value={metrics.activeLorries.toString()}
        unit="Vehicles"
        icon={<CheckCircle2 className="w-5 h-5" />}
        accentColor="emerald"
        tooltip="Lorries currently in active commercial readiness or assigned to routes"
        secondaryText="Ready for Dispatch"
      />

      {/* 3. Available Lorries */}
      <StatCard
        title="Available"
        value={metrics.availableLorries.toString()}
        unit="Lorries"
        icon={<Clock className="w-5 h-5" />}
        accentColor="indigo"
        tooltip="Unassigned or stationary lorries ready to take new freight consignments"
        secondaryText="Immediate Booking"
      />

      {/* 4. On Trip */}
      <StatCard
        title="On Trip"
        value={metrics.onTripLorries.toString()}
        unit="In-Transit"
        icon={<Navigation className="w-5 h-5" />}
        accentColor="blue"
        tooltip="Vehicles currently hauling cargo on transit highways"
        secondaryText="Live Route Transit"
      />

      {/* 5. Under Maintenance */}
      <StatCard
        title="Under Maintenance"
        value={metrics.maintenanceLorries.toString()}
        unit="In Workshop"
        icon={<Wrench className="w-5 h-5" />}
        accentColor="amber"
        tooltip="Lorries undergoing periodic fitness, overhaul, or workshop service"
        secondaryText="Scheduled Repairs"
      />
    </div>
  );
};
