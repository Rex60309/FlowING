"use client";

import { formatTwd } from "@/lib/money";
import { localDateString } from "@/lib/date";
import type { Transaction } from "@/types/finance";

export function TransactionList({
  transactions,
  compact = false,
  onEdit,
}: {
  transactions: Transaction[];
  compact?: boolean;
  onEdit?: (item: Transaction) => void;
}) {
  if (compact)
    return (
      <div className="list">
        {transactions.slice(0, 4).map((item) => (
          <div className="transaction" key={item.id}>
            <div className="badge">{item.category}</div>
            <div>
              <strong>{item.description}</strong>
              <small>
                {item.date} · {item.category}
              </small>
            </div>
            <strong className={item.type === "income" ? "positive" : "negative"}>
              {item.type === "income" ? "+" : "-"}
              {formatTwd(item.amount)}
            </strong>
          </div>
        ))}
      </div>
    );
  const dates = [...new Set(transactions.map((item) => item.date))];
  const today = localDateString();
  return (
    <div className="table-card">
      <table className="table">
        <thead>
          <tr>
            <th>日期</th>
            <th>項目</th>
            <th>帳戶</th>
            <th>分類</th>
            <th>金額</th>
            <th>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const items = transactions.filter((item) => item.date === date);
            const expense = items
              .filter((item) => item.type === "expense")
              .reduce((sum, item) => sum + item.amount, 0);
            const income = items
              .filter((item) => item.type === "income")
              .reduce((sum, item) => sum + item.amount, 0);
            return (
              <>
                <tr className="day-group" key={`${date}-heading`}>
                  <td colSpan={6}>
                    <div className="day-heading">
                      <strong>
                        {date}
                        {date === today ? " · 今天" : ""}
                      </strong>
                      <span>
                        {expense > 0 && <b className="negative">支出 {formatTwd(expense)}</b>}
                        {income > 0 && (
                          <b className="positive">
                            {expense > 0 ? " · " : ""}收入 {formatTwd(income)}
                          </b>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td />
                    <td>
                      <strong>{item.description}</strong>
                    </td>
                    <td>{item.account}</td>
                    <td>
                      <span className={`type ${item.type === "income" ? "income" : ""}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className={item.type === "income" ? "positive" : "negative"}>
                      <strong>
                        {item.type === "income" ? "+" : "-"}
                        {formatTwd(item.amount)}
                      </strong>
                    </td>
                    <td>
                      {onEdit && (
                        <button
                          className="icon-button"
                          onClick={() => onEdit(item)}
                          aria-label={`編輯 ${item.description}`}
                        >
                          編輯
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
