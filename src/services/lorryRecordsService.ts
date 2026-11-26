import {
  LorryDieselRecord,
  LorryExpense,
  LorryInvoice,
  LorryLocationReport,
  LorryMaintenanceRecord,
  LorryNextService,
} from '../types/lorryRecords';
import {
  MOCK_DIESEL,
  MOCK_EXPENSES,
  MOCK_INVOICES,
  MOCK_LOCATION_REPORTS,
  MOCK_MAINTENANCE,
  MOCK_NEXT_SERVICE,
} from './mockLorryRecords';

const byDateDesc = <T extends { date: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.date.localeCompare(a.date));

/**
 * Lorry-scoped read access. Every method filters by the lorry's unique ID so a
 * profile can never display another lorry's records. Swap for /api/v1/lorries/{id}/...
 * when the FastAPI backend exists.
 */
export const LorryRecordsService = {
  getLocationReport(lorryId: string): LorryLocationReport | undefined {
    return MOCK_LOCATION_REPORTS.find((r) => r.lorryId === lorryId);
  },
  getInvoices(lorryId: string): LorryInvoice[] {
    return byDateDesc(MOCK_INVOICES.filter((r) => r.lorryId === lorryId));
  },
  getDiesel(lorryId: string): LorryDieselRecord[] {
    return byDateDesc(MOCK_DIESEL.filter((r) => r.lorryId === lorryId));
  },
  getMaintenance(lorryId: string): LorryMaintenanceRecord[] {
    return byDateDesc(MOCK_MAINTENANCE.filter((r) => r.lorryId === lorryId));
  },
  getNextService(lorryId: string): LorryNextService | undefined {
    return MOCK_NEXT_SERVICE.find((r) => r.lorryId === lorryId);
  },
  getExpenses(lorryId: string): LorryExpense[] {
    return byDateDesc(MOCK_EXPENSES.filter((r) => r.lorryId === lorryId));
  },
};
