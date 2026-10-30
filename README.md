# Flowing

Flowing 是一個以繁體中文呈現的個人記帳與訂閱管理初版。這個展示版以瀏覽器 `localStorage` 保存資料，提供交易、帳戶、預算、訂閱與 CSV 匯出流程；不含登入、雲端同步或真實通知排程。

React 版本使用 `npm run dev` 啟動；`npm run typecheck` 進行型別檢查。

## 專案結構

```text
.openai/hosting.json       Sites 部署設定
app/                       React 頁面、根版型與全域樣式
components/                可重用的 UI 元件
lib/                       初始資料、儲存、金額與 CSV 工具
types/                     共用資料模型
expense-tracker-app-spec.md  產品與後續正式版規格
```
