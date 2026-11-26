import { SavedFuelEstimate } from '../types/fuel';

type Listener = () => void;

/**
 * Temporary in-memory demo store for saved fuel estimates.
 * Kept strictly separate from actual diesel purchases (FUEL_LEDGER) and scoped by lorryId.
 * Resets on full page reload until backend persistence (/api/v1/lorries/{id}/fuel-estimates) is built.
 */
class FuelEstimateServiceClass {
  private estimates: SavedFuelEstimate[] = [];
  private listeners: Set<Listener> = new Set();
  private nextSeq = 1;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getByLorryId(lorryId: string): SavedFuelEstimate[] {
    return this.estimates.filter((e) => e.lorryId === lorryId);
  }

  saveEstimate(data: Omit<SavedFuelEstimate, 'id' | 'createdAt'>): SavedFuelEstimate {
    const record: SavedFuelEstimate = {
      ...data,
      id: `EST-${String(this.nextSeq++).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    this.estimates.unshift(record);
    this.notify();
    return record;
  }

  deleteEstimate(id: string): void {
    this.estimates = this.estimates.filter((e) => e.id !== id);
    this.notify();
  }
}

export const FuelEstimateService = new FuelEstimateServiceClass();
