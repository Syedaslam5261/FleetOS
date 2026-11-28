/**
 * Lightweight session-scoped navigation state store for:
 * 1. Preserving bottom-sheet scroll positions per lorryId + section.
 * 2. Preserving unsubmitted form drafts per lorryId + screen key when navigating back.
 */

const sheetScrollMap = new Map<string, number>();
const formDraftMap = new Map<string, unknown>();

export const NavigationStateStore = {
  setSheetScroll(lorryId: string, section: string, scrollTop: number): void {
    sheetScrollMap.set(`${lorryId}:${section}`, scrollTop);
  },

  getSheetScroll(lorryId: string, section: string): number {
    return sheetScrollMap.get(`${lorryId}:${section}`) ?? 0;
  },

  setDraft<T>(lorryId: string, screenKey: string, data: T): void {
    formDraftMap.set(`${lorryId}:${screenKey}`, data);
  },

  getDraft<T>(lorryId: string, screenKey: string): T | undefined {
    return formDraftMap.get(`${lorryId}:${screenKey}`) as T | undefined;
  },

  clearDraft(lorryId: string, screenKey: string): void {
    formDraftMap.delete(`${lorryId}:${screenKey}`);
  },
};
