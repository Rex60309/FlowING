# PocketFlow

PocketFlow 是一個以繁體中文呈現的個人記帳與訂閱管理初版。這個展示版以瀏覽器 `localStorage` 保存資料，提供交易、帳戶、預算、訂閱與 CSV 匯出流程；不含登入、雲端同步或真實通知排程。

直接以瀏覽器開啟 `dist/index.html`，或部署 `dist/` 作為靜態網站即可使用。

## 專案結構

```text
.openai/hosting.json       Sites 部署設定
dist/index.html            頁面結構與可存取性語意
dist/assets/styles.css     視覺樣式、響應式排版與互動狀態
dist/assets/app.js         記帳資料、畫面渲染與使用者互動
expense-tracker-app-spec.md  產品與後續正式版規格
```
