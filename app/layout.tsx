import type { ReactNode } from "react";
import "./globals.css";
import "./edit.css";
import "./chart.css";
import "./transactions.css";
import "./data-tools.css";
import "./insights.css";
import "./controls.css";
import "./theme.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
