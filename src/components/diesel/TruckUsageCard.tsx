import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Badge } from '../common/Badge';
import { TruckDieselUsage } from '../../types/diesel';
import { formatINR, formatLiters, formatMileage, formatCostPerKm } from '../../utils/formatters';
import { Truck, AlertCircle, CheckCircle2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

interface TruckUsageCardProps {
  truckUsages: TruckDieselUsage[];
  onSelectTruck?: (truck: TruckDieselUsage) => void;
}

export const TruckUsageCard: React.FC<TruckUsageCardProps> = ({ truckUsages, onSelectTruck }) => {
  const [filter, setFilter] = useState<'all' | 'optimal' | 'warning_critical'>('all');

  const filteredTrucks = truckUsages.filter((truck) => {
    if (filter === 'optimal') return truck.performanceStatus === 'optimal';
    if (filter === 'warning_critical') return truck.performanceStatus !== 'optimal';
    return true;
  });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span>Truck-wise Diesel Usage & Performance</span>
          </div>
        }
        subtitle="Fuel consumed, share of fleet diesel, and mileage vs target performance"
        action={
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={clsx(
                'rounded-md px-2.5 py-1 transition-colors',
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All ({truckUsages.length})
            </button>
            <button
              onClick={() => setFilter('optimal')}
              className={clsx(
                'rounded-md px-2.5 py-1 transition-colors',
                filter === 'optimal' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              On Target
            </button>
            <button
              onClick={() => setFilter('warning_critical')}
              className={clsx(
                'rounded-md px-2.5 py-1 transition-colors',
                filter === 'warning_critical' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Needs Attention
            </button>
          </div>
        }
      />

      <CardBody className="p-0 flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
        {filteredTrucks.map((truck) => {
          const mileageDiff = truck.averageMileage - truck.targetMileage;
          const isBelowTarget = mileageDiff < 0;

          return (
            <div
              key={truck.truckId}
              onClick={() => onSelectTruck?.(truck)}
              className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
            >
              {/* Truck Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-slate-900 text-sm tracking-wide bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    {truck.truckNumber}
                  </span>
                  <span className="text-xs text-slate-500">{truck.truckModel}</span>
                  {truck.performanceStatus === 'optimal' ? (
                    <Badge variant="success" size="sm" dot>
                      Efficient
                    </Badge>
                  ) : truck.performanceStatus === 'warning' ? (
                    <Badge variant="warning" size="sm" dot>
                      Near Threshold
                    </Badge>
                  ) : (
                    <Badge variant="critical" size="sm" dot>
                      Below Target
                    </Badge>
                  )}
                </div>

                {/* Progress bar of fleet usage share */}
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 max-w-xs overflow-hidden">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all duration-300',
                        truck.performanceStatus === 'optimal'
                          ? 'bg-blue-600'
                          : truck.performanceStatus === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      )}
                      style={{ width: `${Math.min(truck.usagePercentage * 4, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 font-mono">
                    {truck.usagePercentage.toFixed(1)}% fleet share
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>Driver: <strong className="text-slate-700">{truck.driverAssigned}</strong></span>
                  <span>•</span>
                  <span>Distance: {truck.totalDistanceKm.toLocaleString('en-IN')} km</span>
                </div>
              </div>

              {/* Metrics Column */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Liters and Cost */}
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400">Total Fuel & Cost</p>
                  <p className="font-mono text-sm font-bold text-slate-900">
                    {formatLiters(truck.totalLiters)}
                  </p>
                  <p className="text-xs font-medium text-slate-600 font-mono">
                    {formatINR(truck.totalCost)}
                  </p>
                </div>

                {/* Mileage vs Target */}
                <div className="text-left sm:text-right min-w-[90px]">
                  <p className="text-xs text-slate-400">Mileage / Target</p>
                  <p className="font-mono text-sm font-bold text-slate-900">
                    {truck.averageMileage.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-500">km/L</span>
                  </p>
                  <p
                    className={clsx(
                      'text-xs font-semibold font-mono',
                      isBelowTarget ? 'text-rose-600' : 'text-emerald-600'
                    )}
                  >
                    {isBelowTarget ? '' : '+'}{mileageDiff.toFixed(2)} (tgt {truck.targetMileage.toFixed(2)})
                  </p>
                </div>

                {/* Cost per KM */}
                <div className="text-left sm:text-right hidden md:block min-w-[80px]">
                  <p className="text-xs text-slate-400">Cost/km</p>
                  <p className="font-mono text-sm font-bold text-slate-800">
                    ₹{truck.costPerKm.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400">/ km run</p>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-300 hidden sm:block" />
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
};
