export type Role = 'FLEET_OWNER' | 'FLEET_MANAGER' | 'DRIVER' | 'COMPANY_SHIPPER' | 'ADMIN';

export type TimeRangeFilter = '7d' | '30d' | 'this_month' | 'custom';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  companyName: string;
  avatarUrl?: string;
}

export interface MetricDelta {
  value: number; // e.g. +4.2% or -1.5%
  isPositive: boolean; // whether this is good (for mileage higher is good, for cost/km lower is good)
  label: string;
}
