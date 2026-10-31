import { describe, expect, it } from "vitest";
import {
  applyTransfer,
  dueSubscriptions,
  getActiveBudgets,
  getExpenseCategories,
  moveListItem,
  nextBillingDate,
  orderByPreference,
} from "./finance-rules";
import { initialState } from "./finance-data";

describe("finance rules", () => {
  it("includes sample transactions for November and December 2026", () => {
    const periods = new Set(initialState.transactions.map((item) => item.date.slice(0, 7)));

    expect(initialState.transactions).toHaveLength(66);
    expect(periods.has("2026-11")).toBe(true);
    expect(periods.has("2026-12")).toBe(true);
  });
  it("only exposes enabled budgets", () =>
    expect(
      getActiveBudgets([
        { category: "食物", limit: 100, active: true },
        { category: "娛樂", limit: 100, active: false },
      ])
    ).toEqual([{ category: "食物", limit: 100, active: true }]));
  it("keeps built-in categories and appends custom categories", () =>
    expect(
      getExpenseCategories({
        transactions: [],
        budgets: [],
        subscriptions: [],
        accounts: [],
        customExpenseCategories: ["寵物"],
      })
    ).toContain("寵物"));
  it("uses the shared expense category order for budget lists", () =>
    expect(
      getExpenseCategories({
        transactions: [],
        budgets: [],
        subscriptions: [],
        accounts: [],
        expenseCategoryOrder: ["交通", "食物"],
      }).slice(0, 2)
    ).toEqual(["交通", "食物"]));
  it("preserves a user-defined order while retaining unranked items", () =>
    expect(orderByPreference(["食物", "交通", "日常"], ["日常", "食物"])).toEqual([
      "日常",
      "食物",
      "交通",
    ]));
  it("moves an item without changing the rest of the list", () =>
    expect(moveListItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]));
  it("advances subscription dates across month boundaries", () => {
    expect(nextBillingDate("2026-01-31", "每月")).toBe("2026-02-28");
    expect(nextBillingDate("2024-02-29", "每年")).toBe("2025-02-28");
    expect(nextBillingDate("2026-10-30", "每週")).toBe("2026-11-06");
  });
  it("moves balances without changing the total", () => {
    const result = applyTransfer(
      [
        { id: "a", name: "A", type: "銀行帳戶", balance: 100 },
        { id: "b", name: "B", type: "現金", balance: 20 },
      ],
      { date: "2026-10-31", from: "A", to: "B", amount: 35 }
    );
    expect(result.map((item) => item.balance)).toEqual([65, 55]);
    expect(result.reduce((sum, item) => sum + item.balance, 0)).toBe(120);
  });
  it("only marks active due subscriptions", () =>
    expect(
      dueSubscriptions(
        [
          {
            id: "a",
            name: "A",
            amount: 10,
            cycle: "每月",
            next: "2026-10-31",
            account: "A",
            status: "啟用中",
          },
          {
            id: "b",
            name: "B",
            amount: 10,
            cycle: "每月",
            next: "2026-10-30",
            account: "A",
            status: "已暫停",
          },
        ],
        "2026-10-31"
      ).map((item) => item.id)
    ).toEqual(["a"]));
});
