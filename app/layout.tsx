import type { ReactNode } from "react";
import "./globals.css";
import "./edit.css";
import "./chart.css";
import "./transactions.css";
import "./data-tools.css";
import "./insights.css";
import "./controls.css";
import "./theme.css";
import "./dashboard.css";
import "./transfers.css";
import "./subscription-record.css";
import "./subscription-kpis.css";
import "./subscription-kpi-tuning.css";
import "./cv-polish.css";
import "./language.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
