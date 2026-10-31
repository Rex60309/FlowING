# FlowING

[繁體中文](#繁體中文) · [English](#english)

---

## 繁體中文

### 專案簡介

FlowING 是一個 local-first 個人財務管理 Web App，協助使用者快速理解交易、帳戶餘額、分類預算與固定訂閱的關係。展示版不需要帳號，資料只會儲存在目前瀏覽器的 `localStorage`。

> 這是作品集展示版本。請勿將真實個人財務資料提交到 Git；若部署公開版本，請保留示範資料或先加入帳號與伺服器端資料保護。

### 主要功能

- 收入、支出、淨現金流、分類支出與近 7 日消費圖表
- 交易的年/月、收支類型、關鍵字篩選與 CSV 匯出
- 新增、編輯與刪除交易；收入與支出採不同分類選單
- 可啟用/停用的分類預算、進度條與預算提醒
- 訂閱月成本估算、7 天內扣款通知、自動建立到期交易及安全的補登選項
- 帳戶餘額管理與不影響收支統計的帳戶轉帳
- 自訂收入/支出分類、本機 JSON 備份與還原
- 深/淺色模式及完整繁中/英文介面切換

### 使用教學

1. 先到「帳戶」建立或確認付款來源與初始餘額。
2. 在「交易紀錄」新增收入或支出；選擇類型後，分類選單會相應更新。
3. 使用年、月、類型與搜尋欄篩選歷史交易；可匯出目前期間為 CSV。
4. 到「預算管理」啟用所需分類，再設定每月額度；首頁只顯示已啟用的預算。
5. 在「訂閱管理」設定扣款週期和下一次扣款日。到期時，App 開啟後會自動建立一筆交易並推進日期。若只是補登舊交易，請不要勾選推進日期。
6. 定期至「帳戶」匯出 JSON 備份；還原與重設示範資料也在同一頁。

### 各頁功能

| 頁面     | 用途                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| 首頁     | 顯示選定月份的收支摘要、剩餘預算、近 7 日消費、分類支出、預算進度與最近交易。可點選柱狀圖查看當天交易。            |
| 交易紀錄 | 集中檢視所有交易，可依年、月、類型與關鍵字篩選，並新增、編輯、刪除或匯出資料。每日摘要只顯示實際存在的收入或支出。 |
| 預算管理 | 列出所有支出分類；自行決定是否啟用預算、設定額度並查看使用比例與提醒。                                             |
| 訂閱管理 | 管理固定支出、換算預估月成本、提醒未來 7 天的扣款，並支援自動入帳或手動補登。                                      |
| 帳戶     | 管理付款帳戶和餘額、在帳戶間轉帳、備份或還原本機資料。轉帳不會被算成收入或支出。                                   |
| 分類管理 | 管理內建與自訂的收入/支出分類；有交易或預算關聯的自訂分類不可刪除。                                                |

### 測試資料

示範資料包含 2024–2026 年、54 筆不同日期與分類的交易，適合測試年月篩選、交易排序、圖表與分類統計。若瀏覽器已儲存舊資料，請在「帳戶」頁使用「重設示範資料」後重新載入。

### 本機啟動

```bash
npm install
npm run dev
```

### 品質檢查

```bash
npm run format:check
npm test
npm run typecheck
npm run build
```

程式碼格式可使用 `npm run format` 自動整理；專案以 Prettier 固定 JSX、TypeScript、CSS、JSON 與 Markdown 的換行及縮排規則。

### 技術架構

- React 19、TypeScript、Vinext / Vite
- `localStorage` 本機資料持久化
- Vitest 財務規則測試
- 純 CSS 響應式版面、深淺色主題與介面多語化

### 檔案結構

```text
app/          頁面進入點與樣式模組
components/   可重用的儀表板、交易與介面元件
lib/          財務規則、示範資料、多語化、儲存與匯出工具
types/        共用 TypeScript 資料模型
```

### 資料與隱私

此版本沒有帳號、雲端同步或後端資料庫。資料只存在目前瀏覽器；清除網站資料、切換瀏覽器或裝置前，請先匯出 JSON 備份。若要部署給真實使用者，建議優先加入驗證、資料庫、資料加密、備份與權限控管。

---

## English

### Overview

FlowING is a local-first personal finance web app for understanding the relationship between transactions, account balances, category budgets, and recurring subscriptions. The demo requires no account and keeps its data in the current browser's `localStorage`.

> This is a portfolio demo. Do not commit real financial data to Git. Before public production use, keep demo data only or add authentication and server-side data protection.

### Highlights

- Income, expenses, net cash flow, category spending, and a seven-day spending chart
- Year/month, type, and keyword transaction filters with CSV export
- Create, edit, and delete transactions with type-aware category choices
- Optional category budgets with progress indicators and alerts
- Monthly subscription estimates, seven-day billing alerts, automatic due-date entries, and safe manual backfill
- Account balances and transfers excluded from income/expense totals
- Custom categories plus JSON backup and restore
- Light/dark theme and complete Traditional Chinese/English UI switching

### Quick start guide

1. Create or verify payment sources and opening balances in **Accounts**.
2. Add income or expenses in **Transactions**. The category menu changes with the chosen type.
3. Filter history by year, month, type, or keyword, then export the selected period as CSV when needed.
4. Enable the categories you want in **Budgets**, then set monthly limits. The dashboard only shows active budgets.
5. Configure a billing cycle and next date in **Subscriptions**. When the app opens on or after a due date, it records the charge and advances the date. Leave the advance option unchecked when merely backfilling a past charge.
6. Export a JSON backup regularly from **Accounts**. Restore and reset-demo actions live there too.

### Page guide

| Page          | Purpose                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home          | Shows the selected month's financial summary, remaining budget, seven-day chart, category spending, budget progress, and recent transactions. Select a chart bar for that day's records. |
| Transactions  | Browse, filter, create, edit, delete, and export transactions. Daily summaries only display income or expenses that actually exist.                                                      |
| Budgets       | Lists all expense categories and lets users enable a budget, set a limit, and monitor progress and alerts.                                                                               |
| Subscriptions | Manages recurring costs, monthly estimates, upcoming billing alerts, automatic due entries, and manual backfill.                                                                         |
| Accounts      | Manages payment accounts and balances, transfers between accounts, and local-data backup or restore. Transfers are not treated as income or expenses.                                    |
| Categories    | Manages built-in and custom income/expense categories. A custom category in use by a transaction or budget cannot be deleted.                                                            |

### Demo data

The seeded demo has 54 transactions spanning 2024–2026 across varied dates, categories, and income/expense types. It supports testing filters, sorting, charts, and category analytics. If the browser still has older saved data, use **Reset demo data** under **Accounts**, then reload.

### Run locally

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run format:check
npm test
npm run typecheck
npm run build
```

Run `npm run format` to apply the project's Prettier rules to JSX, TypeScript, CSS, JSON, and Markdown.

### Tech stack

- React 19, TypeScript, Vinext / Vite
- Browser `localStorage` persistence
- Vitest coverage for finance rules
- Responsive CSS, light/dark themes, and UI localization without a third-party UI framework

### Project structure

```text
app/                         App entry point and CSS modules
components/                  Reusable dashboard, transaction, and UI components
lib/                         Domain rules, seed data, localization, storage, and export utilities
types/                       Shared TypeScript data models
```

### Data and privacy

This version has no account system, cloud sync, or server-side database. Data remains in the current browser. Export a JSON backup before clearing site data or switching browsers/devices. For a production deployment with real users, add authentication, a database, encryption, backups, and authorization controls first.
