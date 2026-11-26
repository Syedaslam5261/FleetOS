import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart
} from 'recharts';
import { Card, CardHeader, CardBody } from '../common/Card';
import { DieselConsumptionPoint } from '../../types/diesel';
import { formatINR, formatLiters } from '../../utils/formatters';
import { Fuel, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface ConsumptionChartProps {
  data: DieselConsumptionPoint[];
  granularity: 'daily' | 'weekly' | 'monthly';
  onGranularityChange: (g: 'daily' | 'weekly' | 'monthly') => void;
  isLoading?: boolean;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({
  data,
  granularity,
  onGranularityChange,
  isLoading = false,
}) => {
  const [metricView, setMetricView] = useState<'both' | 'volume' | 'cost'>('both');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as DieselConsumptionPoint;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs font-sans">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
            {point.label} ({point.date})
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Diesel Volume:
              </span>
              <span className="font-mono font-semibold">{formatLiters(point.liters)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Diesel Cost:
              </span>
              <span className="font-mono font-semibold">{formatINR(point.cost)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Distance Run:</span>
              <span className="font-mono text-slate-300">{point.distanceKm.toLocaleString('en-IN')} km</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Avg Rate:</span>
              <span className="font-mono text-slate-300">₹{point.averageRate.toFixed(2)} / L</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-blue-600" />
            <span>Diesel Consumption Trends</span>
          </div>
        }
        subtitle="Diesel volume (Litres) and total expenditure (₹) over operational timelines"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMetricView('both')}
                className={clsx(
                  'rounded-md px-2.5 py-1 transition-colors',
                  metricView === 'both' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Volume & Cost
              </button>
              <button
                type="button"
                onClick={() => setMetricView('volume')}
                className={clsx(
                  'rounded-md px-2.5 py-1 transition-colors',
                  metricView === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Litres Only
              </button>
              <button
                type="button"
                onClick={() => setMetricView('cost')}
                className={clsx(
                  'rounded-md px-2.5 py-1 transition-colors',
                  metricView === 'cost' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Cost (₹)
              </button>
            </div>

            {/* Time Granularity Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => onGranularityChange('daily')}
                className={clsx(
                  'rounded-md px-2.5 py-1 transition-colors',
                  granularity === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => onGranularityChange('weekly')}
                className={clsx(
                  'rounded-md px-2.5 py-1 transition-colors',
                  granularity === 'weekly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => onGranularityChange('monthly')}
                className={clsx(
                  'rounded-md px-2.5 py-1 transition-colors',
                  granularity === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Monthly
              </button>
            </div>
          </div>
        }
      />

      <CardBody className="pt-4 flex-1">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-slate-400">
            <span className="text-xs">Loading diesel timeline metrics...</span>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                {(metricView === 'both' || metricView === 'volume') && (
                  <YAxis
                    yAxisId="liters"
                    orientation="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#3b82f6', fontSize: 11 }}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} L`}
                  />
                )}
                {(metricView === 'both' || metricView === 'cost') && (
                  <YAxis
                    yAxisId="cost"
                    orientation={metricView === 'cost' ? 'left' : 'right'}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#10b981', fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-600 capitalize">{value}</span>
                  )}
                />
                {(metricView === 'both' || metricView === 'volume') && (
                  <Bar
                    yAxisId="liters"
                    name="Diesel Volume (L)"
                    dataKey="liters"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                )}
                {(metricView === 'both' || metricView === 'cost') && (
                  <Line
                    yAxisId="cost"
                    name="Total Cost (₹)"
                    type="monotone"
                    dataKey="cost"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Volume correlates directly with fleet running km</span>
          </div>
          <span className="font-mono text-slate-600">Avg Diesel Rate: ₹91.50/L</span>
        </div>
      </CardBody>
    </Card>
  );
};
