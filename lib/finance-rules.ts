import { expenseCategories, incomeCategories } from "./finance-data";
import type { Account, Budget, FinanceState, Subscription, Transfer } from "../types/finance";

export const orderByPreference = <T extends string>(items: T[], preference?: string[]) => {
  if (!preference?.length) return items;
  const positions = new Map(preference.map((item, index) => [item, index]));
  return [...items].sort((left, right) => {
    const leftPosition = positions.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = positions.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftPosition === rightPosition
      ? items.indexOf(left) - items.indexOf(right)
      : leftPosition - rightPosition;
  });
};
export const moveListItem = <T>(items: T[], from: number, to: number) => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items],
    [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};
export const getExpenseCategories = (state: FinanceState) =>
  orderByPreference(
    [...expenseCategories, ...(state.customExpenseCategories ?? [])],
    state.expenseCategoryOrder
  );
export const getIncomeCategories = (state: FinanceState) =>
  orderByPreference(
    [...incomeCategories, ...(state.customIncomeCategories ?? [])],
    state.incomeCategoryOrder
  );
export const getActiveBudgets = (budgets: Budget[]) =>
  budgets.filter((item) => item.active !== false);
export const formatIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const nextBillingDate = (date: string, cycle: string) => {
  const [year, month, day] = date.split("-").map(Number),
    next = new Date(year, month - 1, 1);
  if (cycle === "每週") next.setDate(day + 7);
  else {
    next.setMonth(next.getMonth() + (cycle === "每年" ? 12 : 1));
    next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  }
  return formatIsoDate(next);
};
export const applyTransfer = (accounts: Account[], transfer: Omit<Transfer, "id">) =>
  accounts.map((item) =>
    item.name === transfer.from
      ? { ...item, balance: item.balance - transfer.amount }
      : item.name === transfer.to
        ? { ...item, balance: item.balance + transfer.amount }
        : item
  );
export const dueSubscriptions = (subscriptions: Subscription[], date: string) =>
  subscriptions.filter((item) => item.status === "啟用中" && item.next <= date);
