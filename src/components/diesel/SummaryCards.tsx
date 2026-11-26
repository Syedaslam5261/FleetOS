import React from 'react';
import { Fuel, IndianRupee, Gauge, Navigation2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { DieselSummaryMetrics } from '../../types/diesel';
import { formatINR, formatLiters, formatMileage, formatCostPerKm } from '../../utils/formatters';

interface SummaryCardsProps {
  metrics: DieselSummaryMetrics;
  periodLabel?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics, periodLabel = 'Last 30 Days' }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Diesel Consumed */}
      <StatCard
        title="Total Diesel Consumed"
        value={formatLiters(metrics.totalDieselLiters).replace(' L', '')}
        unit="Litres"
        icon={<Fuel className="w-5 h-5" />}
        accentColor="blue"
        tooltip="Total diesel filled across all vehicles in the selected period"
        delta={{
          value: metrics.litersDeltaPct,
          isPositiveFavorable: false, // More fuel consumed could be higher operations or lower efficiency
          periodText: 'vs prior 30d',
        }}
        secondaryText={`${metrics.fullTankEntriesCount + metrics.partialEntriesCount} Total Fills`}
      />

      {/* 2. Total Diesel Cost */}
      <StatCard
        title="Total Diesel Cost"
        value={formatINR(metrics.totalDieselCost)}
        icon={<IndianRupee className="w-5 h-5" />}
        accentColor="indigo"
        tooltip="Total expenditure incurred on diesel across company fleet cards and cash disbursements"
        delta={{
          value: metrics.costDeltaPct,
          isPositiveFavorable: false,
          periodText: 'vs prior 30d',
        }}
        secondaryText="Reconciled with Fleet Cards"
      />

      {/* 3. Average Mileage */}
      <StatCard
        title="Average Fleet Mileage"
        value={metrics.averageMileageKmPerL.toFixed(2)}
        unit="km/L"
        icon={<Gauge className="w-5 h-5" />}
        accentColor="emerald"
        tooltip="Weighted fleet average computed primarily on verified Full-Tank-to-Full-Tank refuels"
        delta={{
          value: metrics.mileageDeltaPct,
          isPositiveFavorable: true, // Higher mileage is favorable!
          periodText: 'efficiency +5.2%',
        }}
        secondaryText={`${metrics.fullTankEntriesCount} Verified Full Tanks`}
      />

      {/* 4. Average Cost Per KM */}
      <StatCard
        title="Average Fuel Cost / KM"
        value={formatCostPerKm(metrics.averageCostPerKm)}
        icon={<Navigation2 className="w-5 h-5" />}
        accentColor="amber"
        tooltip="Net fuel expenditure divided by total distance travelled (₹ / km). Lower is better."
        delta={{
          value: metrics.costPerKmDeltaPct,
          isPositiveFavorable: false, // -4.1% is a reduction in cost, which is good!
          periodText: 'cost dropped 4.1%',
        }}
        secondaryText="Target: < ₹24.50/km"
      />
    </div>
  );
};
