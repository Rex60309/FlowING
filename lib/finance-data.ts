import type { FinanceState } from "@/types/finance";

export const expenseCategories = ["食物", "交通", "日常", "娛樂", "住居", "醫療", "其他"];
export const incomeCategories = ["薪資", "獎金", "投資收益", "其他收入"];
export const categories = [...expenseCategories, ...incomeCategories];
export const categoryIcons: Record<string, string> = { 食物: "🍜", 交通: "🚇", 日常: "☀️", 娛樂: "🎬", 住居: "⌂", 醫療: "✚", 其他: "◦", 薪資: "✦", 獎金: "✧", 投資收益: "↗", 其他收入: "+" };
export const storageKey = "pocketflow-v1";
export const initialState: FinanceState = {
  accounts: [{ id: "1", name: "日常銀行帳戶", type: "銀行帳戶", balance: 28640 }, { id: "2", name: "現金錢包", type: "現金", balance: 1250 }, { id: "3", name: "玉山信用卡", type: "信用卡", balance: -4620 }],
  transactions: [
    { id: "1", date: "2026-10-29", description: "公司附近午餐", category: "食物", account: "日常銀行帳戶", amount: 180, type: "expense" }, { id: "2", date: "2026-10-28", description: "捷運往返台北", category: "交通", account: "悠遊卡", amount: 60, type: "expense" }, { id: "3", date: "2026-10-28", description: "十月薪資", category: "薪資", account: "日常銀行帳戶", amount: 52000, type: "income" }, { id: "4", date: "2026-10-27", description: "串流影集", category: "娛樂", account: "玉山信用卡", amount: 390, type: "expense" }, { id: "5", date: "2026-10-26", description: "超市採買", category: "日常", account: "日常銀行帳戶", amount: 735, type: "expense" }, { id: "6", date: "2026-10-25", description: "咖啡與早餐", category: "食物", account: "現金錢包", amount: 145, type: "expense" },
  ],
  budgets: [{ category: "食物", limit: 6000, active: true }, { category: "交通", limit: 2000, active: true }, { category: "日常", limit: 5000, active: true }, { category: "娛樂", limit: 2500, active: true }],
  subscriptions: [{ id: "1", name: "Netflix", amount: 390, cycle: "每月", next: "2026-11-03", account: "玉山信用卡", status: "啟用中" }, { id: "2", name: "iCloud+", amount: 90, cycle: "每月", next: "2026-11-08", account: "日常銀行帳戶", status: "啟用中" }, { id: "3", name: "Spotify", amount: 149, cycle: "每月", next: "2026-11-12", account: "玉山信用卡", status: "啟用中" }],
};
