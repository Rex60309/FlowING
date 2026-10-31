# FlowING

[繁體中文](#繁體中文) · [English](#english)

---

## 繁體中文

FlowING 是一個 local-first 個人財務管理 Web App，用於整合交易、帳戶、預算與訂閱。無須帳號；所有資料僅保存在目前瀏覽器的 `localStorage`。

### 功能

- 收支、淨現金流、分類支出與近 7 日消費圖表
- 交易新增、編輯、刪除、篩選與 CSV 匯出
- 可啟用的分類預算、進度與提醒
- 訂閱成本估算、7 天內扣款通知與到期自動入帳
- 帳戶餘額、帳戶轉帳與自訂收支分類
- JSON 備份／還原、繁中／英文與明暗模式

### 頁面說明

| 頁面     | 用途                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| 首頁     | 檢視選定期間的收支摘要、圖表、分類、預算及最近交易；頁面最下方可備份、還原或重設示範資料。 |
| 交易紀錄 | 篩選、管理與匯出交易；可點選首頁圖表柱狀項目查看當日明細。                                 |
| 預算管理 | 啟用或停用支出分類預算，設定每月額度並檢視使用進度。                                       |
| 訂閱管理 | 管理固定支出、扣款日期與補登交易；到期訂閱會在 App 開啟時自動入帳。                        |
| 帳戶     | 管理付款來源、餘額與帳戶間轉帳；轉帳不納入收支統計。                                       |
| 分類管理 | 管理內建或自訂的收入與支出分類。                                                           |

### 本機啟動

```bash
git clone <repository-url> flowing
cd flowing
npm install
npm run dev
```

請將 `<repository-url>` 替換為 GitHub repository 的 HTTPS 或 SSH 位址；啟動後開啟終端機顯示的本機網址。

### 驗證

```bash
npm run format:check
npm run typecheck
npm test
npm run build
```

### 技術

React 19 · TypeScript · Vinext/Vite · Vitest · CSS · `localStorage`

### 檔案結構

```text
app/          頁面進入點與樣式
components/   可重用介面元件
lib/          財務規則、資料、儲存與匯出工具
types/        共用 TypeScript 型別
```

### 資料與隱私

本專案沒有帳號、雲端同步或後端資料庫。清除網站資料、切換瀏覽器或裝置前，請先從首頁最下方匯出 JSON 備份；公開展示請使用示範資料，勿將真實財務資料提交至 Git。

---

## English

FlowING is a local-first personal finance web app that brings together transactions, accounts, budgets, and subscriptions. No account is required; all data stays in the current browser's `localStorage`.

### Features

- Income, expenses, net cash flow, category spending, and a seven-day chart
- Transaction creation, editing, deletion, filtering, and CSV export
- Optional category budgets with progress and alerts
- Subscription estimates, seven-day billing alerts, and automatic due entries
- Account balances, account transfers, and custom income/expense categories
- JSON backup/restore, Traditional Chinese/English, and light/dark themes

### Pages

| Page          | Purpose                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home          | Reviews the selected period's summary, charts, categories, budgets, and recent transactions. The bottom section provides backup, restore, and demo reset. |
| Transactions  | Filters, manages, and exports transactions. Dashboard chart bars open that day's details.                                                                 |
| Budgets       | Enables or disables expense budgets, sets monthly limits, and shows usage.                                                                                |
| Subscriptions | Manages recurring costs, due dates, and backfills. Due subscriptions are recorded when the app opens.                                                     |
| Accounts      | Manages payment sources, balances, and transfers; transfers are excluded from income/expense totals.                                                      |
| Categories    | Manages built-in and custom income/expense categories.                                                                                                    |

### Run locally

```bash
git clone <repository-url> flowing
cd flowing
npm install
npm run dev
```

Replace `<repository-url>` with the repository's HTTPS or SSH URL, then open the local URL shown in the terminal.

### Validation

```bash
npm run format:check
npm run typecheck
npm test
npm run build
```

### Stack

React 19 · TypeScript · Vinext/Vite · Vitest · CSS · `localStorage`

### File Structure

```text
app/          App entry point and styles
components/   Reusable UI components
lib/          Financial rules, data, storage, and export utilities
types/        Shared TypeScript types
```

### Data and privacy

This project has no accounts, cloud sync, or backend database. Export a JSON backup from the bottom of Home before clearing site data or switching browsers or devices. Use demo data for public showcases; never commit real financial data to Git.
