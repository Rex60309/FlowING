"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTwd } from "@/lib/money";
import type { Transaction } from "@/types/finance";

type Day = { date: string; expense: number; income: number };

function shiftDate(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const local = new Date(year, month - 1, day + offset);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

export function SpendingChart({
  transactions,
  month,
}: {
  transactions: Transaction[];
  month: string;
}) {
  const days = useMemo<Day[]>(() => {
    const [yearValue, monthValue] = month.split("-");
    const year = Number(yearValue),
      value = Number(monthValue);
    const monthEnd =
      yearValue !== "all" && monthValue !== "all"
        ? `${year}-${String(value).padStart(2, "0")}-${String(new Date(year, value, 0).getDate()).padStart(2, "0")}`
        : new Date().toISOString().slice(0, 10);
    const latest = transactions.length
      ? transactions.reduce(
          (date, item) => (item.date > date ? item.date : date),
          transactions[0].date
        )
      : monthEnd;
    return Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(latest, index - 6);
      return transactions
        .filter((item) => item.date === date)
        .reduce<Day>((total, item) => ({ ...total, [item.type]: total[item.type] + item.amount }), {
          date,
          expense: 0,
          income: 0,
        });
    });
  }, [month, transactions]);
  const [hovered, setHovered] = useState<Day | null>(null);
  const [selected, setSelected] = useState<Day | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    setHovered(null);
    setSelected(null);
    setClosing(false);
  }, [month]);
  const max = Math.max(...days.map((day) => day.expense), 1);
  const details = selected ? transactions.filter((item) => item.date === selected.date) : [];
  const close = () => {
    setClosing(true);
    window.setTimeout(() => {
      setSelected(null);
      setClosing(false);
    }, 150);
  };
  const select = (day: Day) => {
    if (selected?.date === day.date) close();
    else {
      setClosing(false);
      setSelected(day);
    }
  };
  return (
    <article className="card chart-card">
      <div className="section-head">
        <h2>近 7 日消費</h2>
        <span className="hint">點擊柱狀圖查看明細</span>
      </div>
      {hovered && !selected && (
        <div className="chart-summary" aria-live="polite">
          <strong>{hovered.date.slice(5).replace("-", "/")}</strong>
          <span>
            支出 <b className="negative">{formatTwd(hovered.expense)}</b> · 收入{" "}
            <b className="positive">{formatTwd(hovered.income)}</b> · 淨額{" "}
            <b>{formatTwd(hovered.income - hovered.expense)}</b>
          </span>
        </div>
      )}
      {selected && (
        <section
          className={`chart-popover ${closing ? "closing" : ""}`}
          aria-label={`${selected.date} 詳細交易`}
        >
          <header>
            <div>
              <strong>{selected.date.slice(5).replace("-", "/")} 當日交易</strong>
              <span>{details.length} 筆紀錄</span>
            </div>
            <button type="button" onClick={close} aria-label="關閉當日交易明細">
              ×
            </button>
          </header>
          <div className="day-transactions">
            {details.length ? (
              details.map((item) => (
                <div className="day-transaction" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <small>
                      {item.category} · {item.account}
                    </small>
                  </div>
                  <b className={item.type === "income" ? "positive" : "negative"}>
                    {item.type === "income" ? "+" : "-"}
                    {formatTwd(item.amount)}
                  </b>
                </div>
              ))
            ) : (
              <p>這天沒有交易紀錄</p>
            )}
          </div>
        </section>
      )}
      <div
        className="chart"
        role="list"
        aria-label="近七日消費柱狀圖"
        onMouseLeave={() => setHovered(null)}
      >
        {days.map((day) => (
          <button
            className={`bar-wrap ${selected?.date === day.date || hovered?.date === day.date ? "selected" : ""}`}
            key={day.date}
            type="button"
            role="listitem"
            onMouseEnter={() => setHovered(day)}
            onFocus={() => setHovered(day)}
            onBlur={() => setHovered(null)}
            onClick={() => select(day)}
            aria-label={`${day.date}，支出 ${formatTwd(day.expense)}，收入 ${formatTwd(day.income)}，淨額 ${formatTwd(day.income - day.expense)}`}
          >
            <i
              className="bar"
              style={{ height: `${Math.max((day.expense / max) * 112, day.expense ? 8 : 3)}px` }}
            />
            <span>{day.date.slice(8)} 日</span>
          </button>
        ))}
      </div>
    </article>
  );
}
