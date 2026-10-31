import { initialState, storageKey } from "@/lib/finance-data";
import type { FinanceState } from "@/types/finance";
export function loadFinanceState(): FinanceState {
  try {
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "") as FinanceState;
    return {
      ...state,
      expenseCategoryOrder: state.expenseCategoryOrder ?? state.budgetOrder,
    };
  } catch {
    return initialState;
  }
}
export function saveFinanceState(state: FinanceState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}
