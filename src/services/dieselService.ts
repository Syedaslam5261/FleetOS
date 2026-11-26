import { 
  DieselEntry, 
  DieselSummaryMetrics, 
  TruckDieselUsage, 
  DieselConsumptionPoint,
  FuelStationSummary,
  MileageTargetSetting
} from '../types/diesel';
import {
  MOCK_SUMMARY_METRICS,
  MOCK_DIESEL_ENTRIES,
  MOCK_TRUCK_USAGES,
  MOCK_DAILY_CONSUMPTION,
  MOCK_WEEKLY_CONSUMPTION,
  MOCK_MONTHLY_CONSUMPTION,
  MOCK_FUEL_STATIONS,
  MOCK_MILEAGE_TARGETS
} from './mockDieselData';

/**
 * Diesel Service
 * Provides data abstraction ready to seamlessly swap mock data with FastAPI REST API endpoints
 * (/api/v1/diesel/...)
 */
export class DieselService {
  private static entries: DieselEntry[] = [...MOCK_DIESEL_ENTRIES];
  private static targets: MileageTargetSetting[] = [...MOCK_MILEAGE_TARGETS];

  // In production with FastAPI:
  // private static readonly API_BASE = '/api/v1/diesel';

  static async getSummaryMetrics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<DieselSummaryMetrics> {
    // Simulated network delay to test loading states properly
    await new Promise(resolve => setTimeout(resolve, 80));
    return { ...MOCK_SUMMARY_METRICS };
  }

  static async getConsumptionData(granularity: 'daily' | 'weekly' | 'monthly'): Promise<DieselConsumptionPoint[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    switch (granularity) {
      case 'weekly':
        return [...MOCK_WEEKLY_CONSUMPTION];
      case 'monthly':
        return [...MOCK_MONTHLY_CONSUMPTION];
      case 'daily':
      default:
        return [...MOCK_DAILY_CONSUMPTION];
    }
  }

  static async getTruckUsages(): Promise<TruckDieselUsage[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    return [...MOCK_TRUCK_USAGES];
  }

  static async getRecentEntries(limit: number = 10): Promise<DieselEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    return this.entries.slice(0, limit);
  }

  static async getFuelStations(): Promise<FuelStationSummary[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    return [...MOCK_FUEL_STATIONS];
  }

  static async getMileageTargets(): Promise<MileageTargetSetting[]> {
    await new Promise(resolve => setTimeout(resolve, 60));
    return [...this.targets];
  }

  static async updateMileageTarget(target: MileageTargetSetting): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const index = this.targets.findIndex(t => t.truckId === target.truckId);
    if (index >= 0) {
      this.targets[index] = target;
    } else {
      this.targets.push(target);
    }
  }

  static async addDieselEntry(entry: Omit<DieselEntry, 'id'>): Promise<DieselEntry> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const newEntry: DieselEntry = {
      ...entry,
      id: `DSL-2026-${Math.floor(1043 + Math.random() * 1000)}`,
    };
    this.entries.unshift(newEntry);
    return newEntry;
  }
}
