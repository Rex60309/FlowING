"use client";

import { useMemo, useState } from "react";
import { formatTwd } from "@/lib/money";
import type { Transaction } from "@/types/finance";

type Day = { date: string; expense: number; income: number };

function shiftDate(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const local = new Date(year, month - 1, day + offset);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

export function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const days = useMemo<Day[]>(() => {
    const latest = transactions.reduce((value, item) => item.date > value ? item.date : value, "2026-10-29");
    return Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(latest, index - 6);
      return transactions.filter((item) => item.date === date).reduce<Day>((total, item) => ({ ...total, [item.type]: total[item.type] + item.amount }), { date, expense: 0, income: 0 });
    });
  }, [transactions]);
  const [selected, setSelected] = useState<Day | null>(null);
  const max = Math.max(...days.map((day) => day.expense), 1);
  const shown = selected ?? days[days.length - 1];
  return <article className="card chart-card"><div className="section-head"><h2>近 7 日消費</h2><span className="hint">懸停查看每日收支</span></div><div className="chart-summary" aria-live="polite"><strong>{shown.date.slice(5).replace("-", "/")}</strong><span>支出 <b className="negative">{formatTwd(shown.expense)}</b> · 收入 <b className="positive">{formatTwd(shown.income)}</b> · 淨額 <b>{formatTwd(shown.income - shown.expense)}</b></span></div><div className="chart" role="list" aria-label="近七日消費柱狀圖">{days.map((day) => <button className={`bar-wrap ${selected?.date === day.date ? "selected" : ""}`} key={day.date} type="button" role="listitem" onMouseEnter={() => setSelected(day)} onFocus={() => setSelected(day)} onClick={() => setSelected(day)} aria-label={`${day.date}，支出 ${formatTwd(day.expense)}，收入 ${formatTwd(day.income)}，淨額 ${formatTwd(day.income - day.expense)}`}><i className="bar" style={{ height: `${Math.max(day.expense / max * 130, day.expense ? 8 : 3)}px` }} /><span>{day.date.slice(8)} 日</span></button>)}</div></article>;
}
