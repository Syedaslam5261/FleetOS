import { Lorry, LorrySummaryMetrics } from '../types/lorry';
import { INITIAL_MOCK_LORRIES } from './mockLorryData';

type Listener = () => void;

class LorryServiceClass {
  private lorries: Lorry[] = [...INITIAL_MOCK_LORRIES];
  private listeners: Set<Listener> = new Set();
  // Monotonic ID counter: IDs are never reused, even after deletes, so a new lorry
  // can never inherit another (deleted) lorry's records.
  private nextSeq: number =
    Math.max(0, ...INITIAL_MOCK_LORRIES.map((l) => Number(l.id.replace(/\D/g, '')))) + 1;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getAllLorries(): Lorry[] {
    return [...this.lorries];
  }

  getLorryById(id: string): Lorry | undefined {
    return this.lorries.find((l) => l.id === id);
  }

  isRegistrationUnique(regNumber: string, excludeLorryId?: string): boolean {
    const clean = regNumber.trim().toUpperCase().replace(/\s+/g, '');
    const existing = this.lorries.find(
      (l) => l.registrationNumber.trim().toUpperCase().replace(/\s+/g, '') === clean
    );
    if (!existing) return true;
    return existing.id === excludeLorryId;
  }

  // Exact 5 metrics: Total Lorries, Active, On Trip, Maintenance, Available
  getSummaryMetrics(): LorrySummaryMetrics {
    const totalLorries = this.lorries.length;
    let activeLorries = 0;
    let onTripLorries = 0;
    let maintenanceLorries = 0;
    let availableLorries = 0;

    for (const l of this.lorries) {
      if (l.status === 'Active') activeLorries++;
      else if (l.status === 'On Trip') onTripLorries++;
      else if (l.status === 'Maintenance') maintenanceLorries++;
      else if (l.status === 'Available') availableLorries++;
    }

    return {
      totalLorries,
      activeLorries,
      onTripLorries,
      maintenanceLorries,
      availableLorries,
    };
  }

  createLorry(lorryData: Omit<Lorry, 'id' | 'createdAt' | 'updatedAt'>): Lorry {
    const cleanReg = lorryData.registrationNumber.trim().toUpperCase();
    if (!this.isRegistrationUnique(cleanReg)) {
      throw new Error(`Registration number "${cleanReg}" already exists in FleetOS.`);
    }

    const newLorry: Lorry = {
      ...lorryData,
      id: `LR-${String(this.nextSeq++).padStart(3, '0')}`,
      registrationNumber: cleanReg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.lorries.unshift(newLorry);
    this.notify();
    return newLorry;
  }

  updateLorry(id: string, updates: Partial<Omit<Lorry, 'id' | 'createdAt'>>): Lorry {
    const index = this.lorries.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Lorry with ID "${id}" not found.`);
    }

    if (updates.registrationNumber) {
      const cleanReg = updates.registrationNumber.trim().toUpperCase();
      if (!this.isRegistrationUnique(cleanReg, id)) {
        throw new Error(`Registration number "${cleanReg}" is already registered to another vehicle.`);
      }
      updates.registrationNumber = cleanReg;
    }

    const existing = this.lorries[index];
    const updated: Lorry = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.lorries[index] = updated;
    this.notify();
    return updated;
  }

  deleteLorry(id: string): boolean {
    const initialLen = this.lorries.length;
    this.lorries = this.lorries.filter((l) => l.id !== id);
    if (this.lorries.length !== initialLen) {
      this.notify();
      return true;
    }
    return false;
  }
}

export const LorryService = new LorryServiceClass();
