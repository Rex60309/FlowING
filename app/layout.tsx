import type { ReactNode } from "react";
import "./globals.css";
import "./controls.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
