import React from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PeriodPoint } from '../../types/fuel';
import { formatINR } from '../../utils/formatters';

export const FuelTrendChart: React.FC<{ data: PeriodPoint[] }> = ({ data }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 11 }} minTickGap={6} />
        <YAxis
          yAxisId="l"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#3b82f6', fontSize: 11 }}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
        />
        <YAxis
          yAxisId="r"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#10b981', fontSize: 11 }}
          tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: unknown, name: unknown): [string, string] => {
            const n = Number(value);
            return name === 'Diesel (L)'
              ? [`${Math.round(n).toLocaleString('en-IN')} L`, String(name)]
              : [formatINR(Math.round(n)), String(name)];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="l" name="Diesel (L)" dataKey="litres" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Line yAxisId="r" name="Spend (₹)" type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);
