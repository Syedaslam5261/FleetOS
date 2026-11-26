import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  delta?: {
    value: number; // percentage
    isPositiveFavorable: boolean; // if positive is favorable (e.g. for mileage positive is good, for cost/km negative is good)
    periodText?: string;
  };
  secondaryText?: string;
  tooltip?: string;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  delta,
  secondaryText,
  tooltip,
  accentColor = 'blue',
}) => {
  const isUp = delta ? delta.value >= 0 : false;
  const isFavorable = delta ? (delta.isPositiveFavorable ? isUp : !isUp) : true;

  const accentStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>{title}</span>
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
            {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>

        <div className={clsx('p-2.5 rounded-lg border', accentStyles[accentColor])}>
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {delta && (
          <div className="flex items-center gap-1 font-medium">
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold',
                isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(delta.value)}%
            </span>
            <span className="text-slate-400">{delta.periodText || 'vs last period'}</span>
          </div>
        )}

        {secondaryText && (
          <span className="text-slate-500 truncate ml-auto text-right">{secondaryText}</span>
        )}
      </div>
    </div>
  );
};
