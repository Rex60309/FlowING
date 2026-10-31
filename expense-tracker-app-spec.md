# 個人記帳與訂閱管理 App：開發規格書

> 文件用途：可直接交給開發 agent 作為實作依據。  
> 專案暫名：`PocketFlow`  
> 版本：v1.0（MVP 規格）  
> 目標使用者：需要快速記錄日常支出、理解消費習慣、避免忘記取消訂閱的個人使用者。

---

## 1. 產品目標與邊界

### 1.1 核心問題

使用者常把消費記在不同地方，月底才發現食物、交通或娛樂花費超出預期；此外，串流、雲端、軟體等訂閱服務容易忘記續訂或取消。

本產品要讓使用者：

1. 在 10 秒內完成一筆支出／收入記錄。
2. 用固定分類與自己的文字描述保留消費脈絡。
3. 一眼看見本月各分類支出、預算進度與近期趨勢。
4. 集中管理訂閱並在續費前收到提醒。

### 1.2 MVP 範圍（必做）

- Email／密碼註冊、登入、登出與個人資料。
- 多帳戶（現金、銀行帳戶、信用卡、電子支付）管理。
- 收入、支出、轉帳記錄；支出可選分類與自行輸入描述。
- 預設支出分類：交通、食物、日常、娛樂；另提供住居、醫療、教育、購物、帳單、其他。
- 分類、日期、帳戶、關鍵字的篩選與搜尋。
- 月／週摘要、分類圓餅圖或長條圖、近期交易列表。
- 每月分類預算與預算進度警示。
- 訂閱建立、週期、下次扣款、金額、付款帳戶與到期提醒。
- 網頁內提醒中心；Email 提醒可列為第一版後半段或 v1.1。
- CSV 匯出自己的交易與訂閱資料。
- 響應式 Web UI，手機瀏覽器操作順暢。

### 1.3 非 MVP（先不做）

- 串接銀行、信用卡或電子發票資料。
- 多人共享帳本、分帳、家庭權限。
- 原生 iOS／Android App。
- OCR 收據辨識。
- 真正的 AI 財務／投資建議。
- 多幣別匯率換算（資料模型保留幣別欄位，MVP 固定 TWD）。

### 1.4 第二階段候選功能

- 自然語言輸入：例如「今天午餐 180，用現金」自動帶入欄位，但送出前必須讓使用者確認。
- 每月消費洞察：只根據使用者自己的資料產生可驗證的摘要，例如與前三個月平均比較。
- 訂閱自動偵測（先以使用者確認的規則為主，不能直接新增扣款）。
- PWA、離線暫存與推播通知。
- 多幣別與旅行模式。

---

## 2. 使用者情境與驗收標準

| 情境     | 使用者操作                                           | 完成條件                                           |
| -------- | ---------------------------------------------------- | -------------------------------------------------- |
| 快速記帳 | 新增支出，選「食物」、金額 180，輸入「公司附近午餐」 | 交易出現在清單與本月食物統計；餘額與預算同步更新。 |
| 自由描述 | 任選分類後填寫描述、標籤與日期                       | 描述可完整保存，且可用關鍵字搜尋。                 |
| 查看花費 | 打開儀表板並選本月                                   | 顯示總支出、各分類、日／週趨勢、預算狀態。         |
| 訂閱提醒 | 新增 Netflix，每月 390、下次扣款日                   | 系統計算下一次扣款並在設定的提醒日前建立提醒。     |
| 取消訂閱 | 將訂閱狀態改為取消／暫停                             | 後續不再產生新的提醒；歷史資料保留。               |
| 資料可攜 | 在設定頁匯出資料                                     | 使用者僅能下載自己帳本的 CSV。                     |

不可省略的驗收原則：所有金額運算必須準確到小數點後兩位；使用者 A 絕不可透過 URL、API 或匯出取得使用者 B 的資料。

---

## 3. 技術選型（預設）

| 層面       | 建議                                                       | 原因                                                     |
| ---------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| 前端與後端 | Next.js（App Router）+ TypeScript                          | 同一專案完成 UI、Server Actions／Route Handlers 與部署。 |
| UI         | Tailwind CSS + shadcn/ui                                   | 快速建立一致且可存取的表單、Dialog、Table。              |
| 表單驗證   | React Hook Form + Zod                                      | 前後端共用 schema，避免無效金額／日期資料。              |
| 資料庫     | PostgreSQL                                                 | 關聯資料、聚合報表與未來擴充都穩定。                     |
| ORM        | Prisma                                                     | 型別安全的 migration 與查詢。                            |
| 身分驗證   | Auth.js 或 Supabase Auth                                   | Email/password 與 session 管理可快速完成。               |
| 圖表       | Recharts                                                   | 支援趨勢、分類及預算視覺化。                             |
| 背景排程   | Vercel Cron + API route（或 Supabase scheduled functions） | 每日產生訂閱提醒。                                       |
| Email      | Resend（可選）                                             | 開發與正式寄信流程簡單。                                 |
| 測試       | Vitest + Testing Library + Playwright                      | 覆蓋商業邏輯、元件與端對端流程。                         |
| 部署       | Vercel + Neon／Supabase PostgreSQL                         | 低維運量，適合作品集。                                   |

禁止在 client bundle 暴露資料庫 URL、Email API key 或任何 `.env` 祕密。金額使用資料庫 `Decimal(14,2)`，程式內避免 JavaScript 浮點數直接相加；以 decimal library 或整數「分」運算。

---

## 4. 資料模型

### 4.1 共通規則

- 所有主鍵使用 UUID。
- 所有資料列有 `createdAt`、`updatedAt`（UTC）。顯示時轉為使用者時區，預設 `Asia/Taipei`。
- `amount` 一律存正數；交易方向由 `type` 判定。
- MVP 金額幣別為 `TWD`，仍保留 `currency` 欄位。
- 所有使用者資料表都必須有 `userId`，每個查詢均以 server-side session 的 user ID 限制。

### 4.2 資料表／實體

#### User

- `id`, `email`, `name`, `timezone`（預設 `Asia/Taipei`）, `currency`（預設 `TWD`）
- 若 Auth provider 已保存帳號資料，可將設定欄位拆到 `UserPreference`。

#### Account

- `id`, `userId`, `name`, `type`（`CASH | BANK | CREDIT_CARD | E_WALLET`）
- `openingBalance`, `currency`, `isArchived`, `color`, `note`
- 信用卡不可用餘額概念取代帳單邏輯；MVP 僅將它作為付款來源，並在交易中顯示累積支出。

#### Category

- `id`, `userId`（系統預設分類可為 `NULL` 或寫入每位使用者）, `name`, `kind`（`EXPENSE | INCOME`）, `icon`, `color`, `isArchived`, `sortOrder`
- 預設支出：交通、食物、日常、娛樂、住居、醫療、教育、購物、帳單、其他。
- 預設收入：薪資、獎金、投資收益、退款、其他。

#### Transaction

- `id`, `userId`, `type`（`EXPENSE | INCOME | TRANSFER`）
- `amount Decimal(14,2)`, `currency`, `occurredAt`, `description`（最多 500 字）, `note`（最多 2,000 字）
- `categoryId`（轉帳可為 `NULL`）, `accountId`
- `transferAccountId`（僅轉帳使用，且不得等於 `accountId`）
- `subscriptionId`（可為 `NULL`，由訂閱預計扣款建立的交易會連結此欄位）
- `createdAt`, `updatedAt`, `deletedAt`（soft delete，避免誤刪遺失紀錄）

#### Tag 與 TransactionTag

- `Tag`: `id`, `userId`, `name`, `color`
- `TransactionTag`: `transactionId`, `tagId`；複合唯一鍵，避免重複標籤。

#### Budget

- `id`, `userId`, `categoryId`, `month`（該月第一天，UTC／當地月分一致的約定）, `limitAmount Decimal(14,2)`, `alertThreshold`（預設 0.8）
- 唯一鍵：`userId + categoryId + month`。

#### Subscription

- `id`, `userId`, `name`, `status`（`ACTIVE | PAUSED | CANCELLED | ENDED`）
- `amount Decimal(14,2)`, `currency`, `billingCycle`（`WEEKLY | MONTHLY | QUARTERLY | YEARLY | CUSTOM_DAYS`）, `customIntervalDays`
- `nextBillingDate`, `startDate`, `endDate`, `categoryId`, `accountId`, `description`, `websiteUrl`, `cancelUrl`
- `reminderDaysBefore`（JSON array，如 `[7, 1]`；MVP 可限 1–30 天）, `lastReminderSentFor`, `createdAt`, `updatedAt`

#### Notification

- `id`, `userId`, `type`（`SUBSCRIPTION_DUE | BUDGET_THRESHOLD | SYSTEM`）, `title`, `body`, `link`, `readAt`, `dedupeKey`, `createdAt`
- `dedupeKey` 唯一，防止每日排程重複建立同一提醒。

### 4.3 重要運算規則

1. 帳戶餘額 = 開帳餘額 + 收入 − 支出，轉帳從來源扣除、向目標增加；已 soft-delete 的交易不計。
2. 分類支出僅納入 `EXPENSE`，依使用者時區切月。
3. 預算使用率 = 當月該分類支出／預算上限；超過 `alertThreshold` 只提醒一次，超過 100% 可再提醒一次。
4. 訂閱的預估月支出必須換算週期：月繳金額直接納入、年繳以 `amount / 12` 顯示為「平均月成本」，但不要把預估值誤當實際交易。
5. 新增訂閱不應自動新增實際交易。提供「本次已扣款，建立交易」按鈕，或未來才做排程自動建立且必須可關閉。

---

## 5. 畫面與 UX 規格

### 5.1 資訊架構

```text
/login                    登入／註冊
/dashboard                儀表板
/transactions             交易清單、篩選、搜尋
/transactions/new         新增交易
/transactions/[id]/edit   編輯交易
/budgets                  月預算
/subscriptions            訂閱清單與即將續費
/subscriptions/new        新增訂閱
/accounts                 帳戶管理
/settings                 分類、標籤、偏好、匯出資料
```

### 5.2 儀表板

- 頂端月份切換器（上月／本月／下月，未來月只顯示預算與預估，不顯示實際支出）。
- KPI：本月支出、本月收入、淨現金流、尚餘預算／已超支分類數。
- 分類支出長條圖或圓餅圖；交通、食物、日常、娛樂應能直接辨識。
- 最近 7／14 日每日支出折線／長條圖。
- 預算卡：以顏色與文字同時表達安全、接近門檻、超支（不可只靠顏色）。
- 即將續費訂閱清單，預設顯示未來 30 天。
- 快速操作按鈕：新增支出、收入、轉帳、訂閱。

### 5.3 新增／編輯交易表單

欄位順序：類型 → 金額 → 分類 → 帳戶 → 日期時間 → 描述 → 標籤 → 備註。

- 預設類型為支出、日期時間為現在、帳戶為上次使用的帳戶（僅儲存在本機偏好）。
- 金額必填且大於 0；不可接受負數、NaN、逗號格式解析錯誤。
- 描述不是必填，但在未填時顯示「例：公司附近午餐／捷運往返台北」。
- 食物、交通、日常、娛樂在新增介面放最前方；仍可以選其他分類與自訂分類。
- 轉帳時隱藏分類，強制選擇來源與目標帳戶。
- 送出後 toast 顯示結果，並可「再新增一筆」；失敗時保留輸入內容。

### 5.4 訂閱管理

- 清單顯示服務名稱、金額、計費週期、下次扣款、付款帳戶、狀態。
- 依「即將扣款」、「啟用中」、「已暫停／取消」分組；支援名稱搜尋與狀態篩選。
- 表單提供常見範例（Netflix、Spotify、iCloud 等）但不預填或聲稱其價格，價格一律由使用者輸入。
- 顯示本月預計扣款總額與平均月成本；兩者標示清楚避免混淆。
- 提醒日期允許設定，例如扣款前 7 天與 1 天。提醒中心可標為已讀。
- 取消只是將狀態設為 `CANCELLED`、記下 `endDate`，絕不刪除歷史。

### 5.5 可用性與可存取性

- 所有可操作元素可用鍵盤操作，有正確 label、focus 狀態與錯誤訊息。
- 行動版底部或浮動新增按鈕應固定且不遮擋內容。
- 色彩對比遵守 WCAG AA；金額不能只用紅／綠判斷，需加上文字或圖示。
- 刪除交易採確認對話框；先做 soft delete，設定頁可在 30 天內復原（若此功能未做，至少後端保留資料）。

---

## 6. API／伺服器動作設計

若採 Next.js Server Actions，可沿用相同的輸入／輸出 schema；若使用 REST，建議如下。

| Method             | Route                                   | 用途                              |
| ------------------ | --------------------------------------- | --------------------------------- |
| `GET`              | `/api/dashboard?month=YYYY-MM`          | 月摘要、圖表資料、即將續費。      |
| `GET/POST`         | `/api/transactions`                     | 取得篩選清單／建立交易。          |
| `GET/PATCH/DELETE` | `/api/transactions/:id`                 | 查詢、更新、soft delete。         |
| `GET/POST`         | `/api/accounts`                         | 帳戶列表／建立帳戶。              |
| `PATCH`            | `/api/accounts/:id`                     | 編輯或封存帳戶。                  |
| `GET/POST`         | `/api/categories`                       | 系統＋自訂分類／新增分類。        |
| `GET/POST`         | `/api/budgets`                          | 月預算／建立或更新預算。          |
| `GET/POST`         | `/api/subscriptions`                    | 訂閱列表／建立訂閱。              |
| `GET/PATCH`        | `/api/subscriptions/:id`                | 詳情、更新狀態、下次扣款。        |
| `POST`             | `/api/subscriptions/:id/record-payment` | 使用者確認後建立一筆實際支出。    |
| `GET/PATCH`        | `/api/notifications`                    | 取得提醒／標記已讀。              |
| `GET`              | `/api/export/transactions.csv`          | 匯出僅屬於登入者的交易。          |
| `POST`             | `/api/jobs/subscription-reminders`      | 排程端點，需用 cron secret 驗證。 |

每個 mutating endpoint 要做：session 驗證、Zod validation、資源所屬權驗證、明確錯誤碼、結構化 server log。不得相信前端傳來的 `userId`。

---

## 7. 專案結構建議

```text
pocketflow/
  app/
    (auth)/
    (app)/dashboard/
    (app)/transactions/
    (app)/subscriptions/
    api/
  components/
    dashboard/
    transactions/
    subscriptions/
    ui/
  lib/
    auth.ts
    db.ts
    money.ts
    dates.ts
    permissions.ts
    validations/
  server/
    services/
      transaction-service.ts
      budget-service.ts
      subscription-service.ts
      notification-service.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  tests/
    unit/
    integration/
    e2e/
  docs/
    architecture.md
    decisions/
  .env.example
  README.md
```

商業規則（餘額、月分歸屬、訂閱下一次日期、提醒去重）放在 `server/services` 與純函式工具中，不能散落於 React 元件。

---

## 8. 開發流程與里程碑

### Phase 0：初始化（0.5–1 天）

1. 建立新的獨立 repository `pocketflow`，不要放在本履歷 LaTeX 專案內。
2. 使用 `create-next-app` 建立 TypeScript、ESLint、Tailwind 專案。
3. 加入 Prettier、Husky、lint-staged、commitlint（可選）與 `.editorconfig`。
4. 建立 PostgreSQL 開發資料庫、Prisma schema、migration 與 seed。
5. 寫 `README.md`：專案目的、安裝、環境變數、常用指令、Demo 截圖位置。
6. 建立 GitHub repository、設定 branch protection（至少 PR 前需通過 lint／test）。

### Phase 1：帳號、資料庫與基本交易（第 1 週）

1. 完成 Auth 與受保護 layout。
2. 建立 Account、Category、Transaction、Tag schema；migration 後實作 seed 預設分類與 Demo 資料。
3. 完成交易 CRUD、表單 Zod validation、交易清單與搜尋／篩選。
4. 實作收入、支出、轉帳的餘額邏輯與單元測試。
5. 完成基本手機版 UI。

完成定義：新帳號可新增「食物／交通／日常／娛樂」交易，留下自由描述，重新整理後資料存在且只看得到自己的資料。

### Phase 2：儀表板與預算（第 2 週）

1. 實作按使用者時區的月彙總 query。
2. 建立 KPI、分類圖表、日趨勢、近期交易元件。
3. 完成 Budget CRUD、預算使用率與門檻提醒。
4. 編寫跨月、轉帳不計分類支出、soft delete 不計算等測試。

完成定義：本月總額、分類合計與交易明細一致，且預算門檻不會重複發出提醒。

### Phase 3：訂閱管理與提醒（第 3 週）

1. 建立 Subscription、Notification schema 與 CRUD。
2. 實作週期加日期函式；處理 1/29、1/30、1/31 等月份邊界（預設取該月最後有效日）。
3. 完成即將續費清單、預估支出與提醒中心。
4. 建立可重複執行的每日 cron job；以 `dedupeKey` 確保冪等。
5. 先在本地以固定日期測試，再部署到 preview 環境驗證。

完成定義：每個啟用訂閱在指定提醒日最多建立一則提醒；取消／暫停後不再有未來提醒。

### Phase 4：資料可攜、安全、測試與上線（第 4 週）

1. 實作 CSV 匯出、空狀態、錯誤頁與 loading state。
2. 補足 unit、integration、e2e 測試及 accessibility 基本檢查。
3. 使用 Vercel Preview 做每個 PR 的驗收，正式環境設 env vars 與 cron secret。
4. 加入 Error tracking（例如 Sentry，可選）與不含個資的結構化 log。
5. 完成 README、架構圖、Demo 帳號（只用假資料）與 1–2 分鐘 demo 影片／GIF。

完成定義：新使用者能註冊、完成核心流程、匯出資料；主流程 Playwright 成功，部署可公開展示。

---

## 9. 訂閱排程細節

### 9.1 每日任務演算法

1. 以每位使用者的時區取得「今天」；MVP 預設 `Asia/Taipei`。
2. 找出 `ACTIVE` 且 `nextBillingDate` 未晚於未來 30 天的訂閱。
3. 對每個 `reminderDaysBefore` 計算 `remindOn = nextBillingDate - daysBefore`。
4. 若 `today == remindOn`，以 `subscriptionId + nextBillingDate + daysBefore` 產生 `dedupeKey`。
5. 嘗試插入 Notification；唯一鍵衝突視為已處理，不重寄。
6. 若要寄 Email，僅在 Notification 成功建立後發送；寄信失敗需記錄並可重試，不能造成重複站內通知。

### 9.2 扣款日更新

- 使用者點選「已扣款」後才建立對應 Transaction，並依 `billingCycle` 計算下一個 `nextBillingDate`。
- 月繳 31 日：下一個沒有 31 日的月份，取該月最後一天；之後是否回到 31 日要明確採「原始 anchor day」邏輯，建議在 Subscription 另存 `billingAnchorDay`。
- 不要在背景 job 無條件產生交易，否則很容易把已取消或扣款失敗的訂閱誤記成支出。

---

## 10. 安全、隱私與資料品質

- 驗證 session 後由 server 決定 `userId`；永不從 client body 信任它。
- 更新／刪除資料前必須查詢 `id + userId`，查不到回傳 404，避免洩漏他人資料存在。
- 密碼只交給受信任 Auth provider hash，程式／log／錯誤訊息都不可記錄密碼、完整交易內容或 CSV。
- 使用 HTTPS、secure cookie、CSRF 防護（依 Auth 方案）、rate limiting（登入與匯出至少要有）。
- `.env`、`.env.local` 永不 commit；只 commit `.env.example`，內容使用 placeholder。
- 備份與刪除政策在 README／設定頁說明。正式服務至少提供帳號資料刪除流程；MVP 可先標記為待實作，但不能假裝已刪除。
- 對外 AI 功能上線前，須取得使用者明確同意哪些交易資料會送至模型供應商；預設關閉。輸出只能當個人財務摘要，不能給投資、貸款或保證性建議。

---

## 11. 測試策略

### 單元測試（必做）

- 金額加減、格式化、禁止浮點誤差。
- 依時區判斷月份與月初／月底。
- 各計費週期的下一扣款日，尤其月底日期與閏年。
- 預算使用率、門檻、重複提醒去重。
- 轉帳雙帳戶餘額更新、soft delete 排除。

### 整合測試（必做）

- 未登入呼叫 API 會被拒絕。
- 使用者不能讀／改／刪其他使用者的交易、帳戶、訂閱。
- 新增支出後儀表板總額和分類值正確。
- 訂閱「已扣款」只建立一筆交易且正確前進下次日期。
- cron job 重跑不會有重複通知。

### E2E 測試（必做的最小集合）

1. 註冊 → 新增帳戶 → 新增食物支出（有描述）→ 在儀表板看到更新。
2. 設定食物預算 → 新增多筆交易 → 顯示接近／超過預算。
3. 新增月訂閱 → 顯示於即將續費 → 標示已扣款 → 交易出現。
4. 使用者 A 無法透過直接 URL 進入使用者 B 的交易。

執行門檻：PR 至少通過 `lint`、`typecheck`、單元／整合測試；main branch 發布前另跑 Playwright。

---

## 12. Git 與協作規範

### 12.1 Repository 初始化

```powershell
mkdir pocketflow
cd pocketflow
git init -b main
git add .
git commit -m "chore: initialize PocketFlow project"
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

- `main` 永遠保持可部署，不直接在 `main` 開發。
- GitHub repository 建議設定為 public，切勿推送真實使用者資料、真實帳密、API key 或 `.env`。
- 建立 GitHub Issues 作為需求與 bug 的唯一追蹤來源；每個 PR 都連結 Issue，例如 `Closes #12`。
- 使用 GitHub Actions（或同等 CI）在 pull request 跑 `lint`、`typecheck`、`test`；若環境具備，再跑 E2E。

### 12.2 Branch 命名

```text
feat/transaction-crud
feat/subscription-reminders
fix/month-end-billing-date
chore/ci-pipeline
docs/update-setup
refactor/extract-money-service
```

一個 branch 只解決一個可審查目標。避免把 schema migration、UI 大改與無關格式化混在同一 PR。

### 12.3 Commit 規範（Conventional Commits）

```text
feat(transactions): add expense form with category and note
fix(subscriptions): clamp monthly billing dates to month end
test(budgets): cover threshold notification deduplication
docs: document local setup and environment variables
chore: configure lint-staged hooks
```

- 每個 commit 應可獨立說明變更；不要使用 `fix`, `update`, `WIP` 這種沒有意義的訊息。
- Commit 前至少跑與變更相關的測試；提交前不要順手混入生成檔、log、`node_modules`。
- 有 migration 時：schema、migration 檔、seed／型別／測試若受影響應同一 PR 完整提交。

### 12.4 每個功能的標準流程

1. 從最新版 `main` 建立 branch：`git switch main`、`git pull --ff-only`、`git switch -c feat/...`。
2. 建立或認領 GitHub Issue，寫明目標、非目標、驗收條件。
3. 先寫／更新 schema、服務層測試，再完成 UI 與 API。
4. 在本機執行 formatter、lint、typecheck、tests。
5. 自行檢查 diff：`git diff --check`、`git status`；確認無祕密與不相關檔案。
6. Push branch 並開 Pull Request，PR 說明需包括：目的、畫面截圖／短影片、測試結果、migration／環境變數變更、風險與 rollback 方法。
7. CI 全綠後 squash merge 到 `main`；部署 Preview 驗證再推正式環境。

### 12.5 `.gitignore` 最少內容

```gitignore
node_modules/
.next/
coverage/
playwright-report/
test-results/
.env
.env.local
.env.*.local
*.log
```

不要 ignore Prisma migrations、lockfile、`.env.example`、測試 fixture（但 fixture 必須是假資料）。

---

## 13. Definition of Done（每個 Issue／PR）

- [ ] 功能符合本文件的驗收條件與非目標。
- [ ] TypeScript strict mode、lint 與 formatter 通過。
- [ ] 輸入有 Zod／伺服器端驗證，並處理 loading、empty、error state。
- [ ] 使用者資料有 server-side ownership check。
- [ ] 金額與日期邊界有測試；新增商業規則亦有相對應測試。
- [ ] 沒有 API key、個資、真實財務資料或 `.env` 被提交。
- [ ] UI 在手機寬度與桌面寬度可用，基本鍵盤操作與 label 完整。
- [ ] README／環境變數／migration 變更已同步更新。
- [ ] PR 包含可檢查的畫面證據與測試結果。

---

## 14. 對開發 agent 的執行指示

1. 先讀完本文件與 repository 現有的 `README.md`、`AGENTS.md`（若有），再改任何程式。
2. 先回報預計修改的檔案、schema 影響與測試計畫；不明確處採最小可逆方案，並在 PR 描述中列出假設。
3. 不得以 mock 成功畫面取代核心資料流程；本地至少要可用 PostgreSQL 與 migration 操作。
4. 不得將金額當 `float`，也不可讓 client 擁有資料授權邏輯。
5. 不要擅自新增 AI、金流、銀行串接或投資建議等超出 MVP 的外部服務。
6. 每完成一個 Phase，提交一個可運作、可測試的 PR；先保留使用者現有變更，絕不使用 destructive Git 指令（如 `reset --hard`）清理工作區。
7. 遇到產品決策未定（例如自訂分類是否可刪、Email 提醒是否啟用）時，先提出選項與影響，而不是自行做不可逆選擇。

---

## 15. 作品集呈現清單

完成後 GitHub README 至少應包含：

- 一句產品定位與功能截圖／GIF。
- Live Demo URL 與安全的 Demo 帳號，或錄製影片（只含假資料）。
- 技術架構圖與資料流說明。
- 功能列表：快速記帳、自由描述、預算、訂閱提醒、匯出。
- 測試策略及 CI badge。
- 隱私與資料安全說明。
- 未來規劃：自然語言記帳、洞察、PWA 等。

CV 描述範例（實際完成後再依真實數據改寫）：

> Built and deployed a personal expense and subscription management web app with TypeScript, Next.js, PostgreSQL, and automated renewal reminders; implemented secure user-scoped financial records, budget analytics, and end-to-end test coverage.
