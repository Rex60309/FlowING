import { describe, expect, it } from "vitest";
import { applyTransfer, dueSubscriptions, getActiveBudgets, getExpenseCategories, nextBillingDate } from "./finance-rules";

describe("finance rules", () => {
  it("only exposes enabled budgets", () => expect(getActiveBudgets([{ category: "食物", limit: 100, active: true }, { category: "娛樂", limit: 100, active: false }])).toEqual([{ category: "食物", limit: 100, active: true }]));
  it("keeps built-in categories and appends custom categories", () => expect(getExpenseCategories({ transactions: [], budgets: [], subscriptions: [], accounts: [], customExpenseCategories: ["寵物"] })).toContain("寵物"));
  it("advances subscription dates across month boundaries", () => { expect(nextBillingDate("2026-01-31", "每月")).toBe("2026-02-28"); expect(nextBillingDate("2024-02-29", "每年")).toBe("2025-02-28"); expect(nextBillingDate("2026-10-30", "每週")).toBe("2026-11-06"); });
  it("moves balances without changing the total", () => { const result = applyTransfer([{ id: "a", name: "A", type: "銀行帳戶", balance: 100 }, { id: "b", name: "B", type: "現金", balance: 20 }], { date: "2026-10-31", from: "A", to: "B", amount: 35 }); expect(result.map((item) => item.balance)).toEqual([65, 55]); expect(result.reduce((sum, item) => sum + item.balance, 0)).toBe(120); });
  it("only marks active due subscriptions", () => expect(dueSubscriptions([{ id: "a", name: "A", amount: 10, cycle: "每月", next: "2026-10-31", account: "A", status: "啟用中" }, { id: "b", name: "B", amount: 10, cycle: "每月", next: "2026-10-30", account: "A", status: "已暫停" }], "2026-10-31").map((item) => item.id)).toEqual(["a"]));
});
