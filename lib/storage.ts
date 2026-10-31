import { initialState, storageKey } from "@/lib/finance-data";
import type { FinanceState } from "@/types/finance";
export function loadFinanceState(): FinanceState {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "") as FinanceState;
  } catch {
    return initialState;
  }
}
export function saveFinanceState(state: FinanceState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}
