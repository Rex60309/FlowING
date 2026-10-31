export type TransactionType = "expense" | "income";
export type Page =
  | "dashboard"
  | "transactions"
  | "budgets"
  | "subscriptions"
  | "accounts"
  | "categories";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  type: TransactionType;
}
export interface Budget {
  category: string;
  limit: number;
  active?: boolean;
}
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: string;
  next: string;
  account: string;
  status: "啟用中" | "已暫停";
}
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}
export interface Transfer {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  note?: string;
}
export interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  accounts: Account[];
  transfers?: Transfer[];
  customExpenseCategories?: string[];
  customIncomeCategories?: string[];
  /** @deprecated Replaced by expenseCategoryOrder so budgets and categories share one order. */
  budgetOrder?: string[];
  expenseCategoryOrder?: string[];
  incomeCategoryOrder?: string[];
}
