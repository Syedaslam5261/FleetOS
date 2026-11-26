import React from 'react';
import { Truck, CheckCircle2, Navigation, Wrench, Clock } from 'lucide-react';
import { LorrySummaryMetrics } from '../../types/lorry';

interface LorrySummaryCardsProps {
  metrics: LorrySummaryMetrics;
}

export const LorrySummaryCards: React.FC<LorrySummaryCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Lorries',
      value: metrics.totalLorries,
      icon: Truck,
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active',
      value: metrics.activeLorries,
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'On Trip',
      value: metrics.onTripLorries,
      icon: Navigation,
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Maintenance',
      value: metrics.maintenanceLorries,
      icon: Wrench,
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Available',
      value: metrics.availableLorries,
      icon: Clock,
      bg: 'bg-teal-50',
      textColor: 'text-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.bg} ${card.textColor}`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
